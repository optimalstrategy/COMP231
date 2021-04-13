import { Router, Request, Response, NextFunction } from "express";
import { UserModel } from "server/models/user/user.model";

const router = Router();

/// [GET] Home page.
router.get("/", async (req: Request, res: Response, _: NextFunction) => {
    let user = null;
    if (req.isAuthenticated()) {
        user = await UserModel.findById(req.user);
    }
    res.render('index', { extractScripts: true, extractStyles: true, user: user });
});

/// [GET] Ticket submission page.
router.get("/submit", async (req: Request, res: Response, _: NextFunction) => {
    let user = null;
    if (req.isAuthenticated()) {
        user = await UserModel.findById(req.user);
    }
    res.render('submit', { extractScripts: true, extractStyles: true, user: user });
});

/// [GET] A temporary page with similar tickets.
router.get("/similar", async (req: Request, res: Response, _: NextFunction) => {
    let user = null;
    if (req.isAuthenticated()) {
        user = await UserModel.findById(req.user);
    }
    res.render('similar', { extractScripts: true, extractStyles: true, user: user });
});


/// [GET] Return the list of developers working on the project.
router.get('/developers', async (_req: Request, res: Response, _: NextFunction) => {
    return res.json({ "developers": ["George", "Hung", "Ibrahim", "Dmitriy", "Faraz", "Prabhnoor"] }).status(200);
});

/// [GET] Returns the registration page.
router.get('/register', async (req: Request, res: Response, _: NextFunction) => {
    let user = null;
    if (req.isAuthenticated()) {
        res.redirect("/account");
        return;
    }
    res.render('register', { extractScripts: true, extractStyles: true, user: user });
});

/// [GET] Returns the login page.
router.get('/login', async (req: Request, res: Response, _: NextFunction) => {
    if (req.isAuthenticated()) {
        res.redirect("/account");
        return;
    }
    res.render('login', { extractScripts: true, extractStyles: true, user: null, error: req.flash("error")[0] });
});

/// [GET] Returns the account page.
router.get('/account', async (req: Request, res: Response, _: NextFunction) => {
    if (!req.isAuthenticated()) {
        res.redirect("/login");
        return;
    }
    const user = await UserModel.findById(req.user);
    const token = await user?.getToken();
    res.render('account', { extractScripts: true, extractStyles: true, user, token });
});


export default router;
