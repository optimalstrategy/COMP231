import { Document, Model } from "mongoose";

/// Defines the interface of a support ticket.
export interface ITicket {
    /// The description of the ticket.
    description: string;
    /// The title, headline, or "global scope" of the ticket.
    headline: string;
    /// The status of the ticket.
    status: "processing" | "processed" | "failed-to-process",
    /// The keywords and scores that were extracted from the ticket description.
    keywords: [string, number][];
    /// The tickets that were found similar to the given ticket and their scores.
    similar: [string | ITicket, number][];
    /// The urgency and category predictions as an array of tuples (category or urgency, score).
    predictions: [string | number, number][];
    /// The date was ticket was created on.
    dateOfEntry?: Date;
    /// The date this ticket was last modified on.
    lastUpdated?: Date;
}

export interface ITicketDocument extends ITicket, Document { }
export interface ITicketModel extends Model<ITicketDocument> { }
