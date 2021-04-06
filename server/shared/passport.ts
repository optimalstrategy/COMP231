/* eslint-disable @typescript-eslint/no-misused-promises */
import passport from "passport";
import passportLocal from "passport-local";
import bcrypt from 'bcryptjs'

import { Request } from 'express';
import { UserModel } from "../models/user/user.model";


export const LocalStrategy = passportLocal.Strategy;

passport.serializeUser<any, any>((_req: Request, user: Express.User, done: any) => {
    done(null, user);
});

passport.deserializeUser(async (id: string, done: any) => {
    const user = await UserModel.findById(id);
    done(null, user?._id);
});

passport.use(new LocalStrategy({ usernameField: "email", passwordField: 'password', }, 
async (email: string, password: string, done) => {
    const user = await UserModel.findOne({ email: email.toLowerCase() });
    if (!user) {
        return done(null, false, { message: `Email ${email} not found.` });
    }
    bcrypt.compare(password, user.password, (err: Error, isMatch: boolean) => {
        if (err) { return done(err); }
        if (isMatch) {
            return done(null, user);
        }
        return done(null, false, { message: "Invalid email or password." });
    });

}));
