import { Schema } from "mongoose";
import { TokenModel } from "../tokens/token.model";
import { ITokenDocument } from "../tokens/token.types";
import { IUser } from "./user.types";


export const UserRoles = Object.freeze({
    TICKET_CREATOR: 'Ticket Creator',
    TICKET_PROCESSOR: 'Ticket Processor',
    HL_TECH_SUPPORT: 'High Level Tech Support',
    DEVELOPER: "Help Desk Software Developer",
});
export const USER_ROLES = [
    UserRoles.TICKET_CREATOR,
    UserRoles.TICKET_PROCESSOR,
    UserRoles.HL_TECH_SUPPORT,
    UserRoles.DEVELOPER
];


const UserSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
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
        enum: USER_ROLES,
        default: "Ticket Creator",
    }
});

UserSchema.methods.getRole = function (): string {
    let self = (this as unknown as IUser);
    let role;
    switch (self.role) {
        case "Ticket Creator":
        case "Ticket Processor":
            role = self.role;
            break;
        case "High Level Tech Support":
            role = "HL. Tech Support";
            break;
        case "Help Desk Software Developer":
        default:
            role = "Developer"
            break;
    }
    return role;
};

UserSchema.methods.getToken = async function (): Promise<ITokenDocument | null> {
    return await TokenModel.findOne({ user_id: this._id });
};


UserSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: function (_doc: any, ret: any) {
        delete ret.password;
        ret.id = ret._id;
    },
});

export default UserSchema;
