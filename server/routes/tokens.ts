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
});


/// [GET] /api/v1/token/quota - Get the current quota information.
router.get('/quota', async (req: Request, res: Response, _: NextFunction): Promise<any> => {
    if (!req.isAuthenticated()) {
        return res.status(StatusCodes.UNAUTHORIZED)
            .json({ error: "User not authenticated" });
    }
    const user = await UserModel.findById(req.user);
    const existing = await user?.getToken();
    if (!existing) {
        return res.status(StatusCodes.NOT_FOUND)
            .json({
                error:
                    "This account doesn't have a token. Use /api/v1/token/apply to apply."
            });
    }
    res.status(StatusCodes.CREATED).json(existing);
})


export default router;
