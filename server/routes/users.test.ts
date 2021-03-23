import request from 'supertest';
import { setTestDb, makeApiPath } from '../shared/functions';
import app from '../app';
import { StatusCodes } from 'http-status-codes';
import { ITicketDocument } from 'server/models/tickets/ticket.types';

setTestDb("user-test-db");

const api = makeApiPath("users");


describe("Users CRUD tests", () => {
    // TODO: more user and auth tests
    it("GET /user/register creates a new user", async (done) => {
        const result = await request(app).post(api("/register")).send({
            "email": "test@localhost",
            "password": "hunter2"
        });
        expect(result.status).toBe(StatusCodes.CREATED);
        expect(result.body.email).toBe("test@localhost");
        expect(result.body.password).toBeUndefined();
        done();
    });
});
