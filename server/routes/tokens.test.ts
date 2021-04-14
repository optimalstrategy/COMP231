import request from 'supertest';
import { setTestDb, makeApiPath, register } from '../shared/functions';
import app from '../app';
import { StatusCodes } from 'http-status-codes';
import { ITicketDocument } from 'server/models/tickets/ticket.types';

setTestDb("token-test-db");

const ticketAPI = makeApiPath("tickets");


function getTestTicket() {
    return {
        "headline": "A test headline.",
        "description": "A long enough test description. Here's 20 more characters.",
    };
}

describe("Token Quota tests", () => {
    it("POST /tickets/submit reject requests that exhausted their quota", async (done) => {
        let agent = request.agent(app);
        const token = await register(agent);

        expect(token.token).toBeDefined();
        expect(token.calls_available).toEqual(20);
        expect(token.calls_made).toEqual(0);

        for (let i = 0; i < token.calls_available; ++i) {
            const result = await agent.post(ticketAPI("/submit")).send(getTestTicket());
            expect(result.status).toBe(StatusCodes.CREATED);
        }

        const result = await agent.post(ticketAPI("/submit")).send(getTestTicket());
        expect(result.status).toBe(StatusCodes.FORBIDDEN);
        expect(result.body.error).toBe("The token has expired or exhausted its quota. Please request a new one at /account.");

        done();
    });
});
