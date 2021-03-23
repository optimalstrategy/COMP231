import request from 'supertest';
import { setTestDb, makeApiPath } from '../shared/functions';
import app from '../app';
import { StatusCodes } from 'http-status-codes';
import { ITicketDocument } from 'server/models/tickets/ticket.types';

setTestDb("ticket-test-db");

const api = makeApiPath("tickets");


describe("Ticket CRUD tests", () => {
    it("GET /tickets/info/:id should return an error if the ticket id is invalid.", async (done) => {
        const result = await request(app).get(api("/info/this-id-is-invalid")).send();

        expect(result.status).toBe(StatusCodes.BAD_REQUEST);
        expect(result.body.error).toBe("Ticket id is invalid.");
        expect(result.body.ticket_id).toBe("this-id-is-invalid");
        done();
    });
    it("GET /tickets/update/:id should returns an error if the ticket is missing or invalid.", async (done) => {
        let result = await request(app).put(api("/update/this-id-is-invalid")).send();
        expect(result.status).toBe(StatusCodes.BAD_REQUEST);
        expect(result.body.error).toBe("Missing ticket id and/or ticket body.");

        result = await request(app).put(api("/update/this-id-is-invalid")).send({
            "ticket": { "headline": "" }
        });
        expect(result.body.error).toBe("Ticket id is invalid.");
        expect(result.body.ticket_id).toBe("this-id-is-invalid");
        done();
    });
    it("GET Test /tickets/submit creates and processes tickets", async (done) => {
        let result = await request(app).post(api("/submit")).send({
            "headline": "",
        });
        expect(result.status).toBe(StatusCodes.BAD_REQUEST);
        expect(result.body.error).toBe("Missing the ticket body.");


        result = await request(app).post(api("/submit")).send({
            "description": "TypeScript is a programming language developed and maintained by Microsoft. It is a strict syntactical superset of JavaScript and adds optional static typing to the language. TypeScript is designed for the development of large applications and transcompiles to JavaScript.",
            "headline": "TypeScript",
        });
        const ticket_id = result.body.ticket_id;
        expect(result.status).toBe(StatusCodes.CREATED);
        expect(ticket_id.length).toBeGreaterThan(0);


        result = await request(app).get(api(`/info/${ticket_id}`));
        expect(result.status).toBe(StatusCodes.OK);

        let body: ITicketDocument = result.body;
        expect(body.id).toBe(ticket_id);
        expect(body.headline).toBe("TypeScript");
        expect(body.status).toBe("processed");
        expect(body.keywords).toStrictEqual(["test", "keywords"]);

        done();
    });
});
