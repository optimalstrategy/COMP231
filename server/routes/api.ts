
import { Router } from 'express';

import TicketRouter from './ticket';
import UserRouter from './users';
import TokenRouter from './token';
const router = Router();

router.use('/tickets', TicketRouter);
router.use('/users', UserRouter);
router.use('/token', TokenRouter);

export default router;
