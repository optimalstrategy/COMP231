import mongoose, { Schema } from "mongoose";
const TokenSchema = new Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'user'
    },
    token: {
        type: String,
        required: true,
    }
});


export default TokenSchema ;
