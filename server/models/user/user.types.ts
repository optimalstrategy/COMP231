import { Document, Model } from "mongoose";
export interface IUser {
    email: string;
    password: string;
    date?: Date
}
export interface IUserDocument extends IUser, Document { }
export interface IUserModel extends Model<IUserDocument> { }
