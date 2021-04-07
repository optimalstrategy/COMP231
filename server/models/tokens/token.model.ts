import { model } from "mongoose";
import { ITokenDocument } from "./token.types";
import TokenSchema from "./token.schema";

export const TokenModel = model<ITokenDocument>("token", TokenSchema)
