import { Router, Request, Response } from 'express';

const router = Router();

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', { title: 'Express' });
});

/* GET Return the list of developers working on the project. */
router.get('/developers', async (req: Request, res: Response, next) => {
    return res.json({ "developers": ["George", "Hung", "Ibrahim"] }).status(200);
});

export default router;
