import { Document, Model } from "mongoose";
export interface ITicket {
    description: string;
    generalScope: string;
    dateOfEntry?: Date;
    lastUpdated?: Date;
}
export interface ITicketDocument extends ITicket, Document {}
export interface ITicketModel extends Model<ITicketDocument> {}
