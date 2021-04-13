import { Router, Request, Response, NextFunction } from 'express';
import { TokenModel } from '../models/tokens/token.model';
import { UserModel } from '../models/user/user.model';
import { v4 as uuidv4 } from 'uuid';
import { StatusCodes } from 'http-status-codes';

const router = Router();


/// [GET] /api/v1/token/apply - Get a newly generated token.
router.get('/apply', async (req: Request, res: Response, _: NextFunction): Promise<any> => {
    if (!req.isAuthenticated()) {
        return res.status(StatusCodes.UNAUTHORIZED)
            .json({ error: "User not authenticated" });
    }
    const user = await UserModel.findById(req.user);
    const existing = await user?.getToken();
    if (existing) {
        await existing.remove();
    }
    const token = await TokenModel.create({
        user_id: user?._id,
        token: uuidv4()
    });
    res.status(StatusCodes.CREATED).json(token);
})


export default router;
