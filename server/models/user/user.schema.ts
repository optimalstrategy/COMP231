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
