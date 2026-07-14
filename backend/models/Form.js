import mongoose from "mongoose";

// contact form schema
const contactFormSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  }, 
  email: {
    type: String,
    required: true,
  },
  mobileNum: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "handled"],
    default: "pending",
},
},
  { timestamps: true } 
);

// Speeds up the admin contacts list, which sorts by createdAt descending
// and is commonly filtered/updated by status (pending vs handled).
contactFormSchema.index({ createdAt: -1 });
contactFormSchema.index({ status: 1 });

export const ContactForm = mongoose.model("ContactForm", contactFormSchema);



//book appointment form schema
const bookingFormSchema = new mongoose.Schema({
  department: {
    type: String,
    required: true,
  },
  service: {
    type: String,
    required: true,
  },
  preferredDate: {
    type: Date,
    required: true,
  },
  preferredTime: {
    type: String,
    required: true,
    },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  mobileNum: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    },
  message: {
    type: String,
    required: false,
    },    
  status: {
    type: String,
    enum: ["pending", "handled", "cancelled"],
    default: "pending",
},
},
  { timestamps: true } 
);

// Same reasoning as ContactForm — admin bookings list sorts by createdAt
// descending and filters/updates by status.
bookingFormSchema.index({ createdAt: -1 });
bookingFormSchema.index({ status: 1 });

// Enforces one booking per date+time slot at the database level (global
// slot lock, not per-doctor/department). This is a unique index rather
// than just an application-level check so two simultaneous submissions
// for the same slot can't both slip through a race condition — Mongo
// itself rejects the second insert with a duplicate key error (code 11000),
// which bookForm below catches and turns into a friendly 409 response.
//
// partialFilterExpression excludes cancelled bookings from the uniqueness
// check, so once a booking is cancelled its date+time slot becomes
// available again for a new booking.
bookingFormSchema.index(
  { preferredDate: 1, preferredTime: 1 },
  { unique: true, partialFilterExpression: { status: { $ne: "cancelled" } } },
);

export const BookingForm = mongoose.model("BookingForm", bookingFormSchema);