import { Router } from 'express';
import { TicketModel } from "../models/tickets/ticket.model";
import { ITicket } from "../models/tickets/ticket.types";

const router = Router();

router.post('/', async (req, res, next) => {
    try {
        const createTicket = await TicketModel.create(req.body);
        res.status(201).json(createTicket)
    }catch (e) {
        res.status(400).json(e)
    }

})
router.get('/:id', async (req, res, next) =>{
    try {
        const ticket = await TicketModel.findById(req.params.id);
        res.status(200).json(ticket);
    }catch (e) {
        res.status(500).json(e)
    }
})
router.get('/', async (req, res, next) =>{
    try {
        const tickets = await TicketModel.find();
        res.status(200).json(tickets);
    }catch (e) {
        res.status(500).json(e)
    }
})
export default router;
