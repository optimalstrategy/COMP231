
import { Router } from 'express';

import TicketRouter from './ticket';
import UserRouter from './users';

const router = Router();

router.use('/tickets', TicketRouter);
router.use('/users', UserRouter);


export default router;
