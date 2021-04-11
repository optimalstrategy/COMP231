import { Document, Model } from "mongoose";
export interface IUser {
    email: string;
    password: string;
    date?: Date;
    role: 'Ticket Creator'
    | 'Ticket Processor'
    | 'High Level Tech Support'
    | 'Help Desk Software Developer';
}
export interface IUserDocument extends IUser, Document { }
export interface IUserModel extends Model<IUserDocument> { }
