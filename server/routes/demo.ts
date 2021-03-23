import { Router, Request, Response, NextFunction } from "express";

const router = Router();

/// [GET] home page.
router.get("/", function (_req: Request, res: Response, _: NextFunction) {
    res.render("index", { title: "Express" });
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
