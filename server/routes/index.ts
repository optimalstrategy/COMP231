import { Router } from 'express';
import UserRouter from './users';
import DemoRouter from './demo';
import APIRouter from './api';

const router = Router();

router.use('/', DemoRouter);
router.use('/api/v1', APIRouter);
router.use('/users', UserRouter);

export default router;
