import { Router } from 'express';

const router = Router();

router.get('/developers', function(req, res, next) {
  res.json({"developers": ["Ibrahim"]}).status(200);
});


export default router;
