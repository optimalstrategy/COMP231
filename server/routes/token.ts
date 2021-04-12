import { Router, Request, Response, NextFunction } from 'express';
import { TokenModel } from '../models/tokens/token.model';
import { UserModel } from '../models/user/user.model';
import { v4 as uuidv4 } from 'uuid';
import { StatusCodes } from 'http-status-codes';

const router = Router();


/// [GET] /api/v1/token/:user_id - Get a newly generated token.
router.get('/:user_id', async (req: Request, res: Response, _: NextFunction): Promise<any> => {
    const { user_id } = req.params;
    const user = await UserModel.findById(user_id);
    const token = await TokenModel.create({
        user_id: user?._id,
        token: uuidv4()
    });
    res.status(StatusCodes.CREATED).json(token);
})


export default router;
