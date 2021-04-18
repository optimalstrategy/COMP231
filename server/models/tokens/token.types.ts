import { Document, Model } from "mongoose";

/// Represents an API usage token.
export interface IToken {
    /// The id of the user this token belongs to.
    user_id: string,
    /// The token itself.
    token: string,
    /// The date the token was obtain on.
    obtained: Date;
    /// The expiry date of the token.
    expires?: Date;
    /// The number of API calls that have already been made.
    calls_made: number;
    /// The number of API calls that can be made in total.
    calls_available: number;
    /// Returns `true` if the token is valid.
    isValid(): boolean;
}

export interface ITokenDocument extends IToken, Document { }
export type ITokenModel = Model<ITokenDocument>
