/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable prefer-const */
/* eslint-disable @typescript-eslint/no-misused-promises */
import { Request, Response, Router } from 'express';
import {UserModel} from '../models/user/user.model';
import passport from 'passport';
import bcrypt from 'bcryptjs';
const router = Router();
import "../shared/passport";
router.get('/register', (req,res)=>{
    res.render('register');
});

router.get('/login',(req,res)=>{
    res.render('login');
});

router.post('/register',async (req,res)=>{
    let {email, password} = req.body;
    try {
        let user = await UserModel.findOne({email: email});
        if(!user){
            const salt = await bcrypt.genSalt(12);
            password = await bcrypt.hash(password, salt);
            user = await UserModel.create({email, password})
        }
        res.contentType('json').status(201).json(user);
    } catch (e) {
        res.status(404).json(e)
    }
});

router.post('/login',(req, res, next) => {
    passport.authenticate('local',{
        successRedirect : '/',
        failureRedirect : '/users/login',
    })(req,res,next);
});

router.get('/logout',(req, res, next)=>{});

export default router;
