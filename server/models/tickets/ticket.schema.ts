import { Schema } from "mongoose";

const TicketSchema = new Schema({
    description: String,
    headline: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ["processing", "processed", "failed-to-process"],
        default: "processing"
    },
    keywords: {
        type: Array,
        default: []
    },
    similar: {
        type: Array,
        default: []
    },
    predictions: {
        type: Array,
        default: []
    },
    dateOfEntry: {
        type: Date,
        default: new Date()
    },
    lastUpdated: {
        type: Date,
        default: new Date()
    }
});

TicketSchema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: function (_doc: any, ret: any) {
        ret.id = ret._id;
        ret.ticket_id = ret._id;
        ret.priority = ret.predictions[0];
        ret.category = ret.predictions[1];
    },
});


export default TicketSchema;
