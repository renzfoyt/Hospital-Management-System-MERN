import { ContactForm, BookingForm } from "../../models/Form.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * @typedef {Object} BookingRequestBody
 * @property {string} department
 * @property {string} service
 * @property {string} preferredDate - ISO date string, e.g. "2026-07-10"
 * @property {string} preferredTime
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} mobileNum
 * @property {string} email
 * @property {string} [message] - optional
 */

/**
 * @typedef {Object} ContactRequestBody
 * @property {string} name
 * @property {string} email
 * @property {string} mobileNum
 * @property {string} message
 */

/**
 * User submits "Book an Appointment" form
 * @param {import("express").Request<{}, {}, BookingRequestBody>} req
 * @param {import("express").Response} res
 */
export const bookForm = asyncHandler(async (req, res) => {
  const {
    department,
    service,
    preferredDate,
    preferredTime,
    firstName,
    lastName,
    mobileNum,
    email,
    message,
  } = req.body;

  const newBooking = new BookingForm({
    department,
    service,
    preferredDate,
    preferredTime,
    firstName,
    lastName,
    mobileNum,
    email,
    message,
  });

  await newBooking.save();

  res.status(200).json({
    message: "Booking request received successfully",
    booking: newBooking,
  });
});

/**
 * User submits "Contact Us" form
 * @param {import("express").Request<{}, {}, ContactRequestBody>} req
 * @param {import("express").Response} res
 */
export const contactForm = asyncHandler(async (req, res) => {
  const { name, email, mobileNum, message } = req.body;

  const newContact = new ContactForm({
    name,
    email,
    mobileNum,
    message,
  });

  await newContact.save();

  res.status(200).json({
    message: "Contact request received successfully",
    contact: newContact,
  });
});

/* ---------------------- ADMIN: BOOKINGS ---------------------- */

/**
 * Admin: get all bookings, or one booking by id
 * @param {import("express").Request<{ id?: string }>} req
 * @param {import("express").Response} res
 */
export const adminGetBookings = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (id) {
    const booking = await BookingForm.findById(id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    return res.status(200).json(booking);
  }

  const bookings = await BookingForm.find().sort({ createdAt: -1 });
  res.status(200).json(bookings);
});

/**
 * Admin: update a booking by id
 * @param {import("express").Request<{ id: string }, {}, Partial<BookingRequestBody>>} req
 * @param {import("express").Response} res
 */
export const adminUpdateBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const updatedBooking = await BookingForm.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updatedBooking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  res.status(200).json({
    message: "Booking updated successfully",
    booking: updatedBooking,
  });
});

/**
 * Admin: delete a booking by id
 * @param {import("express").Request<{ id: string }>} req
 * @param {import("express").Response} res
 */
export const adminDeleteBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deletedBooking = await BookingForm.findByIdAndDelete(id);

  if (!deletedBooking) {
    return res.status(404).json({ message: "Booking not found" });
  }

  res.status(200).json({ message: "Booking deleted successfully" });
});

/* ---------------------- ADMIN: CONTACTS ---------------------- */

/**
 * Admin: get all contacts, or one contact by id
 * @param {import("express").Request<{ id?: string }>} req
 * @param {import("express").Response} res
 */
export const adminGetContacts = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (id) {
    const contact = await ContactForm.findById(id);
    if (!contact) {
      return res.status(404).json({ message: "Contact not found" });
    }
    return res.status(200).json(contact);
  }

  const contacts = await ContactForm.find().sort({ createdAt: -1 });
  res.status(200).json(contacts);
});

/**
 * Admin: update a contact by id
 * @param {import("express").Request<{ id: string }, {}, Partial<ContactRequestBody>>} req
 * @param {import("express").Response} res
 */
export const adminUpdateContact = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const updatedContact = await ContactForm.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updatedContact) {
    return res.status(404).json({ message: "Contact not found" });
  }

  res.status(200).json({
    message: "Contact updated successfully",
    contact: updatedContact,
  });
});

/**
 * Admin: delete a contact by id
 * @param {import("express").Request<{ id: string }>} req
 * @param {import("express").Response} res
 */
export const adminDeleteContact = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deletedContact = await ContactForm.findByIdAndDelete(id);

  if (!deletedContact) {
    return res.status(404).json({ message: "Contact not found" });
  }

  res.status(200).json({ message: "Contact deleted successfully" });
});