import { Document, Model } from "mongoose";

export interface ITicket {
    description: string;
    headline: string;
    status: "processing" | "processed" | "failed-to-process",
    keywords: [string, number][];
    dateOfEntry?: Date;
    lastUpdated?: Date;
}

export interface ITicketDocument extends ITicket, Document { }
export interface ITicketModel extends Model<ITicketDocument> { }
