import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false, // never returned by default — must be explicitly requested
    },
  },
  { timestamps: true }
);

export const Admin = mongoose.model("Admin", adminSchema);