import { Router } from 'express';

const router = Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
router.get('/developers', function(req, res, next) {
  res.json({"developers": ["Ibrahim"]}).status(200);
});


export default router;
