import { Document, Model } from "mongoose";

/// Defines the interface of a possible user.
export interface IUser {
    /// The name of the user.
    name: string;
    /// The email of the user.
    email: string;
    /// A bcrypt hash of the user's password.
    password: string;
    /// The date this user was created?
    date?: Date;
    /// The role that this user has.
    role: 'Ticket Creator'
    | 'Ticket Processor'
    | 'High Level Tech Support'
    | 'Help Desk Software Developer';
}
export interface IUserDocument extends IUser, Document { }
export interface IUserModel extends Model<IUserDocument> { }
