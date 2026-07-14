import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import { validate } from "../middleware/validate.js";
import {
  bookingFormSchema,
  contactFormSchema,
  updateStatusSchema,
  updateBookingStatusSchema,
} from "../schemas/formSchema.js";

import {
  bookForm,
  contactForm,
  getBookedSlots,
  adminGetBookings,
  adminUpdateBooking,
  adminDeleteBooking,
  adminGetContacts,
  adminUpdateContact,
  adminDeleteContact,
} from "../controllers/formController.js";

const router = express.Router();

// Public form submissions
router.get("/booking/slots", getBookedSlots);
router.post("/booking", validate(bookingFormSchema), bookForm);
router.post("/contacts", validate(contactFormSchema), contactForm);

// Admin: bookings
router.get("/admin/bookings", verifyToken, adminGetBookings);
router.get("/admin/bookings/:id", verifyToken, adminGetBookings);
router.put("/admin/bookings/:id", verifyToken, validate(updateBookingStatusSchema), adminUpdateBooking);
router.delete("/admin/bookings/:id", verifyToken, adminDeleteBooking);

// Admin: contacts
router.get("/admin/contacts", verifyToken, adminGetContacts);
router.get("/admin/contacts/:id", verifyToken, adminGetContacts);
router.put("/admin/contacts/:id", verifyToken, validate(updateStatusSchema), adminUpdateContact);
router.delete("/admin/contacts/:id", verifyToken, adminDeleteContact);

export default router;