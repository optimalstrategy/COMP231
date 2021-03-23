import mongoose from "mongoose";
import { TaskConnection, TaskQueue } from "./conn";

beforeAll(async (done) => {
    async function clearDB() {
        for (var i in mongoose.connection.collections) {
            await mongoose.connection.collections[i].deleteMany({});
        }
        return done();
    }

    if (mongoose.connection.readyState !== 0) {
        return await clearDB();
    }
    mongoose.connect(
        `mongodb://localhost/${process.env.TEST_SUITE}`,
        { useNewUrlParser: true, useUnifiedTopology: true },
        async (err) => {
            if (err) throw err;
            return await clearDB();
        }
    );
});

afterAll(async (done) => {
    mongoose.disconnect();
    await TaskQueue.close();
    await TaskConnection.close();
    return done();
});