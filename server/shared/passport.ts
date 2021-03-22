/* eslint-disable @typescript-eslint/no-misused-promises */
import passport from "passport";
import passportLocal from "passport-local";
import bcrypt from 'bcryptjs'
import { UserModel } from "../models/user/user.model";
import { NativeError } from "mongoose";
import {IUserDocument} from "../models/user/user.types";
const LocalStrategy = passportLocal.Strategy;
passport.serializeUser<any, any>((req, user, done) => {
    done(undefined, user);
});
passport.deserializeUser(async (id: any, done: any) => {
    try {
        const user = await UserModel.findById(id);
        done(undefined, user?._id);
    } catch (e) {
        done(e)
    }
});
passport.use(new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
    try {
        const user = await UserModel.findOne({ email: email.toLowerCase() });
        if (!user) {
            return done(undefined, false, { message: `Email ${email} not found.` });
        }
        bcrypt.compare(password, user.password ,(err: Error, isMatch: boolean) => {
            if (err) { return done(err); }
            if (isMatch) {
                return done(undefined, user);
            }
            return done(undefined, false, { message: "Invalid email or password." });
        });
    } catch (e) {
        return done(e);
    }
}));
