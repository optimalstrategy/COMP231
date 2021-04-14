import { Document, Model } from "mongoose";

export interface IToken {
    user_id: string,
    token: string,
    obtained: Date;
    expires?: Date;
    calls_made: number;
    calls_available: number;
    /// Returns `true` if the token is valid.
    isValid(): boolean;
}

export interface ITokenDocument extends IToken, Document { }
export type ITokenModel = Model<ITokenDocument>
