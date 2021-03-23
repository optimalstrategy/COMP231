import { Router, Request, Response, NextFunction } from 'express';
import StatusCode, { StatusCodes } from 'http-status-codes';

import { sendForProcessing } from '../shared/conn';
import { TicketModel } from "../models/tickets/ticket.model";
import { ITicketSubmission, ITicketUpdate } from './interfaces';
import { Types } from 'mongoose';

const router = Router();


/// [GET] /api/v1/ticket/info/:id - Get a ticket using its ID. Also returns the current status of the ticket.
router.get('/info/:id', async (req: Request, res: Response, _: NextFunction) => {
    const id = req.params.id;

    if (!Types.ObjectId.isValid(id)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            "error": "Ticket id is invalid.",
            "ticket_id": id
        });
    }

    const ticket = await TicketModel.findById(id);
    if (!ticket) {
        return res.status(StatusCodes.NOT_FOUND).json({
            "error": "Ticket with this id doesn't exist.",
            "ticket_id": id
        });
    }

    res.status(StatusCode.OK).json(ticket);
})


/// [PUT] /api/v1/ticket/update/:id - Update a ticket using its ID.
router.put('/update/:id', async (req: Request, res: Response, _: NextFunction) => {
    const id = req.params.id;
    const { ticket, settings, requiresProcessing }: ITicketUpdate = req.body;

    if (!id || !ticket) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            "error": "Missing ticket id and/or ticket body."
        });
    }

    if (!Types.ObjectId.isValid(id)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            "error": "Ticket id is invalid.",
            "ticket_id": id
        });
    }

    const updatedTicket = await TicketModel.findByIdAndUpdate(id, {
        "description": ticket.description,
        "headline": ticket.headline,
        "dateOfEntry": ticket.dateOfEntry,
        "keywords": ticket.keywords,
        "lastUpdated": new Date(Date.now()),
        "status": "processing",
    });

    if (!updatedTicket) {
        return res.status(StatusCodes.NOT_FOUND).json({
            "error": "Ticket with this id doesn't exist.",
            "id": id
        });
    }

    if (requiresProcessing) {
        await sendForProcessing(updatedTicket, settings);
    }

    return res.status(StatusCodes.OK).json(updatedTicket);
});

/// [POST] /api/v1/ticket/submit - Submit a ticket for processing
router.post('/submit', async (req: Request, res: Response, _: NextFunction) => {
    const payload: ITicketSubmission = req.body;

    // TODO: Add check for minimum ticket length here.
    if (!payload.description) {
        return res.status(StatusCode.BAD_REQUEST).json({ "error": "Missing the ticket body." });
    }

    const ticket = await TicketModel.create({
        "description": payload.description,
        "headline": payload.headline,
    });

    await sendForProcessing(ticket, payload.settings);
    return res.status(StatusCode.CREATED).json({ "ticket_id": ticket.id });
});



export default router;
