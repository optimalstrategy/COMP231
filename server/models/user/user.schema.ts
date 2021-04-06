import { Schema } from "mongoose";
const UserSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    role: {
        type: String,
        enum: [
            'Ticket Creator', 
            'Ticket Processor', 
            'High Level Tech Support', 
            'Help Desk Software Developer'
        ]
    }
});

UserSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: function (_doc: any, ret: any) {
        delete ret.password;
        ret.id = ret._id;
    },
});

export default UserSchema;
