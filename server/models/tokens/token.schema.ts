import mongoose, { Schema } from "mongoose";
import { ITokenDocument } from "./token.types";

const TokenSchema = new Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true,
    },
    token: {
        type: String,
        required: true,
    },
    obtained: {
        type: Date,
        default: Date.now,
        required: true,
    },
    expires: {
        type: Date,
        default: null,
        required: false
    },
    calls_made: {
        type: Number,
        default: 0,
        required: true,
    },
    calls_available: {
        type: Number,
        default: 20,
        required: true,
    }
});

TokenSchema.methods.isValid = function () {
    let self = this as unknown as ITokenDocument;
    return self.calls_made < self.calls_available && (!self.expires || new Date() < self.expires);
}

export default TokenSchema;
