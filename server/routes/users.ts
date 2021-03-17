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

    let {name, email, password, password2} = req.body;
    let errors: any[] = [];
    if(!name || !email || !password || !password2) {
        errors.push({msg : "Please fill in all fields"})
    }
    //check if match
    if(password !== password2) {
        errors.push({msg : "passwords dont match"});
    }
    //check if password is more than 6 characters
    if(password.length < 6 ) {
        errors.push({msg : 'password atleast 6 characters'})
    }
    if(errors.length > 0 ) {
        res.render('register', {
            errors : errors,
            name : name,
            email : email,
            password : password,
            password2 : password2})
    } else {
        try {
            const user = await UserModel.findOne({email: email});
            if(!user){
                const salt = await bcrypt.genSalt(12);
                password = await bcrypt.hash(password, salt);
                await UserModel.create({email, password})
            }
            res.redirect('/users/login');
        } catch (e) {
            errors.push({msg: 'error creating user'})
        }
    }
});

router.post('/login',(req,res,next)=>{
    passport.authenticate('local',{
        successRedirect : '/',
        failureRedirect : '/users/login',
    })(req,res,next);
});

router.get('/logout',(req,res)=>{
})

export default router;
