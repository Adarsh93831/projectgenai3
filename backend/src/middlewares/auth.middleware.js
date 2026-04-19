import jwt from "jsonwebtoken";

import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const verifyJWT = asyncHandler(async (req, _res, next) => {
  const token = req.cookies?.accessToken;

  if (!token) {
    throw new ApiError(401, "Unauthorized request: access token is missing");
  }

  const tokenSecret =
    process.env.ACCESS_TOKEN_SECRET ||
    (process.env.NODE_ENV !== "production"
      ? "dev_access_token_secret_change_me"
      : undefined);

  if (!tokenSecret) {
    throw new ApiError(500, "ACCESS_TOKEN_SECRET is required in production");
  }

  try {
    const decodedToken = jwt.verify(token, tokenSecret);

    const user = await User.findById(decodedToken.userId).select("-password");

    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }

    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, "Invalid or expired access token", [error?.message]);
  }
});

export { verifyJWT };
