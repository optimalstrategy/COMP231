import logger from "morgan";
import createError from "http-errors";
import cookieParser from "cookie-parser";
import express, {
    NextFunction,
    Request,
    Response,
} from "express";
import path from "path";
import helmet from "helmet";
import mongoose from "mongoose";
import cors from "cors";
import StatusCodes from "http-status-codes";
import "express-async-errors";
const { BAD_REQUEST, INTERNAL_SERVER_ERROR } = StatusCodes;

import Logger from "./shared/logger";
import { isRunningUnderJest } from "./shared/functions";
import { cookieProps, DB_URI, CORS } from "./shared/constants";

// Avoid connecting to the database
if (!isRunningUnderJest()) {
    mongoose.connect(DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    const mongoDB = mongoose.connection;
    mongoDB.on("error", console.error.bind(console, "Connection Error:"));
    mongoDB.once("open", () => {
        console.log("Connected to MongoDB...");
    });
}

import * as models from "./models";
import BaseRouter from "./routes";

const app = express();

app.use(cors(CORS));
// Allow cross-origin requests in dev environments
if (process.env.NODE_ENV !== "production") {
    // Official docs say to do this (https://expressjs.com/en/resources/middleware/cors.html),
    // but typescript doesn't like it for some reason.
    app.options("*", cors(CORS) as any);
}

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));


// Show routes called in console during development
if (process.env.NODE_ENV === "development") {
    app.use(logger("dev"));
} else {
    app.use(logger("combined"));
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Security
if (process.env.NODE_ENV === "production") {
    app.use(helmet());
}

// Routes
app.use("/", BaseRouter);

// catch 404 and forward to error handler
app.use(async (req: Request, res, next) => {
    if (req.path.startsWith("/api")) {
        // Return JSON responses for 404s
        res.status(404).json({});
    } else {
        next(createError(404));
    }
});

// error handler
app.use(async (err: any, req: Request, res: Response, _next: NextFunction) => {
    if (req.path.startsWith("/api")) {
        Logger.error(err);

        let statusCode: number;
        let error: string;
        try {
            error = JSON.stringify(err);
            statusCode = BAD_REQUEST;
        } catch (ex) {
            Logger.error(ex);
            error = "<could not report the error>";
            statusCode = INTERNAL_SERVER_ERROR;
        }
        return res.status(statusCode).json({
            error: error,
        });
    } else {
        // set locals, only providing error in development
        res.locals.message = err.message;
        res.locals.error = req.app.get("env") === "development" ? err : {};

        // render the error page
        res.status(err.status || 500);
        res.render("error");
    }
});

export default app;
