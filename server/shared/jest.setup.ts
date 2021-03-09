import mongoose from "mongoose";

beforeEach(async (done) => {
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

afterEach(function (done) {
    mongoose.disconnect();
    return done();
});

afterAll(done => {
    return done();
});