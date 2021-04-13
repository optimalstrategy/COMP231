import { NextFunction, Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import passport from 'passport';
import bcrypt from 'bcryptjs';

import "../shared/passport";
import { UserModel } from '../models/user/user.model';
import { UserRoles, USER_ROLES } from "../models/user/user.schema";

import Logger from 'server/shared/logger';

const router = Router();

interface RegistrationPayload {
    name: string;
    email: string;
    password: string;
    confirmation: string;
    role: string;
}

/// [POST] /api/v1/users/register - Create a new user account.
router.post('/register', async (req: Request, res: Response) => {
    let { name, email, password, confirmation, role }: RegistrationPayload = req.body;

    if (!name || !email || !password || !confirmation) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            "error": "Missing any or all of email, password, confirmation."
        })
    }

    if (password !== confirmation) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            "error": "Passwords don't match (password != confirmation)."
        });
    }

    let chosenRole = role || UserRoles.DEVELOPER;
    if (USER_ROLES.findIndex((r) => r == chosenRole) == -1) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            "error": `Invalid user role: ${chosenRole}. Expected one of the values in validRoles.`,
            "validRoles": USER_ROLES,
        });
    }

    let user = await UserModel.findOne({ email });
    if (user) {
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
            "error": "A user with this email already exists.",
            "email": email
        });
    }

    const salt = await bcrypt.genSalt(12);
    const pwdHash = await bcrypt.hash(password, salt);
    user = await UserModel.create({ name, email, password: pwdHash, role: chosenRole })

    req.login(user, (_) => { });
    res.status(StatusCodes.CREATED).json(user);
});

// XXX: These two endpoints shouldn't probably be here since they redirect to HTML

/// [POST] /api/v1/users/login - Attempt to login with the given email and password.
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login',
        failureFlash: true,
    })(req, res, next);
});


/// [GET] /api/v1/users/logout
router.get('/logout', (req: Request, res: Response, _: NextFunction) => {
    req.session.destroy((_) => {
        res.redirect('/');
    });
});


export default router;
