import { Router } from "express";

import {
	getCurrentUser,
	login,
	logout,
	register,
} from "../controllers/auth.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", verifyJWT, logout);
authRouter.get("/me", verifyJWT, getCurrentUser);

export { authRouter };
