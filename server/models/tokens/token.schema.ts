import mongoose, { Schema } from "mongoose";

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
    }
});


export default TokenSchema;
