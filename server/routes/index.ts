import { Router } from 'express';
import UserRouter from './users';
import DemoRouter from './demo';


const router = Router();

router.use('/', DemoRouter);
router.use('/users', UserRouter);

export default router;
