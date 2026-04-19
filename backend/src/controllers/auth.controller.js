import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const register = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  if (
    [fullName, email, password].some(
      (field) => !field || String(field).trim() === ""
    )
  ) {
    throw new ApiError(400, "fullName, email and password are required");
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });

  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  const user = await User.create({
    fullName: fullName.trim(),
    email: email.toLowerCase().trim(),
    password,
  });

  const accessToken = user.generateToken();
  const createdUser = await User.findById(user._id).select("-password");
  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions ={
    httpOnly: true,
    secure: isProduction,
    sameSite: "Strict",
  };

  return res
    .status(201)
    .cookie("accessToken", accessToken, cookieOptions)
    .json(new ApiResponse(201, createdUser, "User registered successfully"));
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  const accessToken = user.generateToken();

  const loggedInUser = await User.findById(user._id).select("-password");

  const isProduction = process.env.NODE_ENV === "production";
  const cookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "Strict",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .json(new ApiResponse(200, loggedInUser, "User logged in successfully"));
});

const logout = asyncHandler(async (_req, res) => {
  const isProduction = process.env.NODE_ENV === "production";

  return res
    .status(200)
    .clearCookie("accessToken", {
      httpOnly: true,
      secure: isProduction,
      sameSite: "Strict",
    })
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"));
});

export { register, login, logout, getCurrentUser };
