import request from 'supertest';
import { setTestDb } from '../shared/functions';
import app from '../app';


// Isn't needed for this test but required for all tests that interact with the database.
// The name of the database must be unique.
setTestDb("demo-test-db");

describe("A sample test demonstrating how to test APIs", () => {
    it("Request / should return HTTP 200 OK", async (done) => {
        const result = await request(app).get("/").send();

        expect(result.status).toBe(200);
        expect(result.text.startsWith("<!DOCTYPE html>")).toBeTruthy();
        done();
    });
    it("Request /developers should return developer names", async (done) => {
        const result = await request(app).get("/developers").send();

        expect(result.status).toBe(200);
        const developers: String[] = result.body.developers;
        expect(developers).toEqual(["George", "Hung", "Ibrahim", "Dmitriy", "Faraz", "Prabhnoor"]);
        done();
    });
});
