import { NextFunction, Request, Response, Router } from 'express';
import { StatusCodes } from 'http-status-codes';
import passport from 'passport';
import bcrypt from 'bcryptjs';

import "../shared/passport";
import { UserModel } from '../models/user/user.model';

const router = Router();

/// [POST] /api/v1/users/register - Create a new user account.
router.post('/register', async (req: Request, res: Response) => {
    let { email, password, confirmation }:
        { email: string, password: string, confirmation: string } = req.body;

    if (!email || !password || !confirmation) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            "error": "Missing any or all of email, password, confirmation."
        })
    }

    if (password !== confirmation) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            "error": "Passwords don't match (password != confirmation)."
        });
    }

    let user = await UserModel.findOne({ email: email });
    if (user) {
        return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
            "error": "A user with this email already exists.",
            "email": email
        });
    }

    const salt = await bcrypt.genSalt(12);
    const pwdHash = await bcrypt.hash(password, salt);
    user = await UserModel.create({ email, password: pwdHash })
    return res.status(StatusCodes.CREATED).json(user);
});

// XXX: These two endpoints shouldn't probably be here since they redirect to HTML

/// [POST] /api/v1/users/login - Attempt to login with the given email and password.
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
    console.log(JSON.stringify(req.body, null, 4));
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login',
    })(req, res, next);
});


/// [POST] /api/v1/users/logout - 
router.get('/logout', (req: Request, res: Response, _: NextFunction) => {
    req.session.destroy((_) => {
        res.redirect('/');
    });
});

export default router;
