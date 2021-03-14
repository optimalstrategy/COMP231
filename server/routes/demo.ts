import { Router, Request, Response } from 'express';

const router = Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


router.get('/developer', function(req:Request, res:Response, next) {
  res.json({"developers":["faraz"]}).status(200)
});

export default router;
