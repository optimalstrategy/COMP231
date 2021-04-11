import { Router, Request, Response, NextFunction } from "express";
import { TicketModel } from "../models/tickets/ticket.model";

const router = Router();

/// [GET] Home page.
router.get("/", function (_req: Request, res: Response, _: NextFunction) {
    res.render("index");
});

/// [GET] home page.
router.get("/submit", function (_req: Request, res: Response, _: NextFunction) {
    res.render("submit");
});

router.get("/info/:id", async (req: Request, res: Response, _: NextFunction) => {
    let user = null;
    let ticket = null;
    if (req.isAuthenticated()) {
        user = await UserModel.findById(req.user);
        ticket = await TicketModel.findById(req.params.id)
    }
    res.render('info', { extractScripts: true, extractStyles: true, user: user, ticket: ticket });
});

/// [GET] Return the list of developers working on the project.
router.get('/developers', async (_req: Request, res: Response, _: NextFunction) => {
    return res.json({ "developers": ["George", "Hung", "Ibrahim", "Dmitriy", "Faraz", "Prabhnoor"] }).status(200);
});

/// [GET] Returns the registration page.
router.get('/register', (_req: Request, res: Response, _: NextFunction) => {
    res.render('register');
});

/// [GET] Returns the login page.
router.get('/login', (_req: Request, res: Response, _: NextFunction) => {
    res.render('login');
});

export default router;
