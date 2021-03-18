import StatusCode from 'http-status-codes';
import { v4 as uuidv4 } from 'uuid';

import { Router, Request, Response } from 'express';
import { TaskQueue } from '../shared/conn';
import { Message } from '@droidsolutions-oss/amqp-ts';
import { REPLY_TO_QUEUE } from 'server/shared/constants';
import { ITicketSubmission } from './interfaces';

const router = Router();


/* POST Submit a ticket */
router.post('/submit', async (req: Request, res: Response, next) => {
    const payload: ITicketSubmission = req.body;

    if (!payload.body) {
        return res.json({ "error": "Missing the ticket body." }).status(StatusCode.BAD_REQUEST);
    }

    const id = `ticket-${uuidv4()}`;
    TaskQueue.send(new Message({
        "ticket_id": id,
        "body": payload.body,
        "headline": payload.headline || "",
        "settings": payload.settings || {},
    }, { replyTo: REPLY_TO_QUEUE }));
    return res.json({ "ticket_id": id }).status(StatusCode.OK)
});

export default router;
