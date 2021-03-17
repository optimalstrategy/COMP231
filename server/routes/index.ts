import { Router } from 'express';
import UserRouter from './users';
import DemoRouter from './demo';
import TicketRouter from './ticket';


const router = Router();

router.use('/users', UserRouter);
router.use('/tickets', TicketRouter);
router.get('/', (req, res, next) => {
    res.render('index')
})
export default router;
