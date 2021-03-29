import { Router, Request, Response, NextFunction } from "express";

const router = Router();

/// [GET] Home page.
router.get("/", function (_req: Request, res: Response, _: NextFunction) {
    res.render("index", { extractScripts: true, extractStyles: true });
});

/// [GET] Ticket submission page.
router.get("/submit", function (_req: Request, res: Response, _: NextFunction) {
    res.render("submit", { extractScripts: true, extractStyles: true });
});

/// [GET] A temporary page with similar tickets.
router.get("/similar", function (_req: Request, res: Response, _: NextFunction) {
    res.render("similar", { extractScripts: true, extractStyles: true });
});


/// [GET] Return the list of developers working on the project.
router.get('/developers', async (_req: Request, res: Response, _: NextFunction) => {
    return res.json({ "developers": ["George", "Hung", "Ibrahim", "Dmitriy", "Faraz", "Prabhnoor"] }).status(200);
});

/// [GET] Returns the registration page.
router.get('/register', (_req: Request, res: Response, _: NextFunction) => {
    res.render('register', { extractScripts: true, extractStyles: true });
});

/// [GET] Returns the login page.
router.get('/login', (_req: Request, res: Response, _: NextFunction) => {
    res.render('login', { extractScripts: true, extractStyles: true });
});

export default router;
