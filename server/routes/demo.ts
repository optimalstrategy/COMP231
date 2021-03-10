import { Router, Request, Response } from 'express';

const router = Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/* Return the list of developers on the project. */
router.get('/developers', async (req: Request, res: Response, next) => {
  return res.json({"developers": ["Hung"] }).status(200);
});


export default router;
