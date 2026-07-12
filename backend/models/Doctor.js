import mongoose from "mongoose";

// Doctor schema — powers the public "Find a Doctor" page and the admin CRUD
const doctorSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    specialty: { type: String, required: true }, // e.g. "Cardiology"
    subSpecialty: { type: String, required: false }, // e.g. "Interventional Cardiology"
    department: { type: String, required: true },
    credentials: { type: String, required: false },
    bio: { type: String, required: false },
    photoUrl: { type: String, required: false },
    email: { type: String, required: false },
    contactNumber: { type: String, required: false },
    gender: {
      type: String,
      enum: ["Male", "Female"],
      required: false,
    },
    clinicDays: {
      type: [String], // e.g. ["Mon", "Wed", "Fri"]
      default: [],
    },
    clinicHourIn: {
      type: String, // e.g. "8:00 AM"
      required: false,
    },
    clinicHourOut: {
      type: String, // e.g. "5:00 PM"
      required: false,
    },
    hmoAccepted: {
      type: [String], // e.g. ["Maxicare", "Medicard"]
      default: [],
    },
    availability: {
      type: [String], // legacy free-text notes, kept for admin reference
      default: [],
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

// Covers the public "Find a Doctor" query: find({ status: "active" }).sort({ lastName: 1 }).
// A compound index lets Mongo satisfy both the filter and the sort from
// the index itself, instead of scanning every doctor document.
doctorSchema.index({ status: 1, lastName: 1 });

export const Doctor = mongoose.model("Doctor", doctorSchema);