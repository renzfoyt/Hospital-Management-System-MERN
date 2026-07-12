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
    enum: ["pending", "handled"],
    default: "pending",
},
},
  { timestamps: true } 
);

// Same reasoning as ContactForm — admin bookings list sorts by createdAt
// descending and filters/updates by status.
bookingFormSchema.index({ createdAt: -1 });
bookingFormSchema.index({ status: 1 });

export const BookingForm = mongoose.model("BookingForm", bookingFormSchema);
