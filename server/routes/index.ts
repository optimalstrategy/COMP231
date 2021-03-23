import { Router } from 'express';
import DemoRouter from './demo';
import APIRouter from './api';

const router = Router();

router.use('/', DemoRouter);
router.use('/api/v1', APIRouter);

export default router;
