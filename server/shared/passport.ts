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
passport.deserializeUser((id, done) => {
    UserModel.findById(id, (err: NativeError, user: IUserDocument) => {
        done(err, user.id);
    });
});
passport.use(new LocalStrategy({ usernameField: "email" }, (email, password, done) => {
    UserModel.findOne({ email: email.toLowerCase() }, (err: NativeError, user: IUserDocument) => {
        if (err) { return done(err); }
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
    });
}));
