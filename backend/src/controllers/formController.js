import { ContactForm, BookingForm } from "../../models/Form.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { paginate } from "../utils/paginate.js";

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

  try {
    await newBooking.save();
  } catch (err) {
    // Duplicate key on the { preferredDate, preferredTime } unique index —
    // someone already booked this exact slot (possibly seconds ago, in a
    // race with this very request). Give a specific, actionable message
    // instead of falling through to the generic errorHandler's
    // "field already exists" wording.
    if (err.code === 11000) {
      return res.status(409).json({
        message:
          "That date and time slot was just booked by someone else. Please choose a different time.",
      });
    }
    throw err;
  }

  res.status(200).json({
    message: "Booking request received successfully",
    booking: newBooking,
  });
});

/**
 * Public: list already-booked times for a given date, so the frontend can
 * grey out taken slots before the user even submits.
 * @param {import("express").Request<{}, {}, {}, { date?: string }>} req
 * @param {import("express").Response} res
 */
export const getBookedSlots = asyncHandler(async (req, res) => {
  const { date } = req.query;

  if (!date || Number.isNaN(new Date(date).getTime())) {
    return res.status(400).json({ message: "A valid date query param is required" });
  }

  // Match the whole calendar day regardless of what time component the
  // stored Date happens to carry, rather than relying on exact millisecond
  // equality with a freshly-parsed Date.
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const bookings = await BookingForm.find(
    { preferredDate: { $gte: startOfDay, $lt: endOfDay }, status: { $ne: "cancelled" } },
    "preferredTime -_id",
  );

  res.status(200).json({ bookedTimes: bookings.map((b) => b.preferredTime) });
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

  const { items: bookings, total } = await paginate(BookingForm, {
    sort: { createdAt: -1 },
    req,
  });

  res.set("X-Total-Count", total);
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

  const { items: contacts, total } = await paginate(ContactForm, {
    sort: { createdAt: -1 },
    req,
  });

  res.set("X-Total-Count", total);
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