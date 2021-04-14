import { Types, model } from "mongoose";
import { ITicketDocument } from "./ticket.types";
import { ITicket } from "server/models/tickets/ticket.types";
import TicketSchema from "./ticket.schema";

/// Fetches the similar tickets associated with the given ticket from the database.
export async function prefetchSimilarTickets(ticket: ITicketDocument): Promise<[ITicket, number][]> {
    const id2index: Record<string, number> = {};
    const tickets_to_fetch = ticket.similar.map((v, i) => {
        id2index[v[0] as unknown as string] = i;
        return Types.ObjectId(v[0] as unknown as string);
    });
    const similar_tickets = await TicketModel.find({
        '_id': { $in: tickets_to_fetch }
    });
    similar_tickets.sort(t => id2index[t.id]);
    return similar_tickets.map((t, i) => [t, ticket.similar[i][1]]);
}


export const TicketModel = model<ITicketDocument>("ticket", TicketSchema)
