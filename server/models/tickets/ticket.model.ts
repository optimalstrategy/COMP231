import { model } from "mongoose";
import { ITicketDocument } from "./ticket.types";
import TicketSchema from "./ticket.schema";

export const TicketModel = model<ITicketDocument>("ticket", TicketSchema)
