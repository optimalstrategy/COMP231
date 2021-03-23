import { Connection, Message } from "@droidsolutions-oss/amqp-ts";
import { ITicketDocument } from "server/models/tickets/ticket.types";
import { ISubmissionSettings } from "server/routes/interfaces";
import { AMQP_URI, REPLY_TO_QUEUE, TASK_QUEUE_NAME } from "./constants";
import { isRunningUnderJest } from "./functions";
import Logger from "./logger";

interface ITaskResult {
    status: "OK" | "ERROR";
    ticket_id: string;
    error?: string;
    results?: {
        keywords: [string, number][];
    },
    settings?: Record<string, any>,
}

const connection = new Connection(AMQP_URI);
const queue = connection.declareQueue(TASK_QUEUE_NAME, { durable: false });

connection.declareQueueAsync(REPLY_TO_QUEUE).then(async queue => {
    await queue.activateConsumer((message: Message) => {
        const json = message.getJsonContent<ITaskResult>();
        Logger.info(`RPC Reply Message received for ticket ${json.ticket_id} with ID=` + message.properties.correlationId);
        Logger.info(`Result was ${json.status}.`);
        Logger.debug(`Full response: ${JSON.stringify(json, null, 4)}`);

        // TODO: put the info into the database here

        message.ack();
    });
});

/// Posts the ticket on the queue for processing.
async function _sendForProcessing(ticket: ITicketDocument, settings?: ISubmissionSettings) {
    TaskQueue.send(new Message({
        "ticket_id": ticket.id,
        "body": ticket.description,
        "headline": ticket.headline,
        "settings": settings || {},
    }, { replyTo: REPLY_TO_QUEUE }));
}

async function _sendForProcessingStub(ticket: ITicketDocument, settings?: ISubmissionSettings) {
    Logger.debug("[RPC] Creating a fake ticket during testing.");
    ticket.status = "processed";
    ticket.keywords = ["test", "keywords"];
    await ticket.save();
}


export const TaskConnection = connection;
export const TaskQueue = queue;
export const sendForProcessing = isRunningUnderJest() ? _sendForProcessingStub : _sendForProcessing;

