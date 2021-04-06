import { Document, Model } from "mongoose";

export interface IToken {
    user_id: string,
    token: string
}

export interface ITokenDocument extends IToken, Document { }
export type ITockenModel = Model<ITokenDocument>
