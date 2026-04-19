import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.generateToken = function () {
  const tokenSecret =
    process.env.ACCESS_TOKEN_SECRET ||
    (process.env.NODE_ENV !== "production"
      ? "dev_access_token_secret_change_me"
      : undefined);

  if (!tokenSecret) {
    throw new Error("ACCESS_TOKEN_SECRET is required in production");
  }

  return jwt.sign(
    {
      userId: this._id,
    },
    tokenSecret,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d",
    }
  );
};

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

export { User };
