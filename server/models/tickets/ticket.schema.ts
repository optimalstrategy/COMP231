import { Schema } from "mongoose";
const TicketSchema = new Schema({
    description: String,
    generalScope: String,
    dateOfEntry: {
        type: Date,
        default: new Date()
    },
    lastUpdated: {
        type: Date,
        default: new Date()
    }
});

export default TicketSchema;
