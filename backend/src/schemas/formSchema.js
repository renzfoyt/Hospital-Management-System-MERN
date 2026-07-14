import { z } from "zod";

const mobileNum = z
  .string({ message: "Mobile number is required" })
  .trim()
  .regex(/^09\d{9}$/, "Must be a valid PH mobile number (e.g. 09171234567)");

export const contactFormSchema = z.object({
  name: z.string({ message: "Name is required" }).trim().min(1, "Name is required").max(150),
  email: z.string({ message: "Email is required" }).trim().email("Must be a valid email"),
  mobileNum,
  message: z.string({ message: "Message is required" }).trim().min(1, "Message is required").max(2000),
});

export const bookingFormSchema = z.object({
  department: z.string({ message: "Department is required" }).trim().min(1, "Department is required").max(150),
  service: z.string({ message: "Service is required" }).trim().min(1, "Service is required").max(150),
  preferredDate: z.coerce.date({ message: "A valid preferred date is required" }),
  preferredTime: z.string({ message: "Preferred time is required" }).trim().min(1, "Preferred time is required").max(50),
  firstName: z.string({ message: "First name is required" }).trim().min(1, "First name is required").max(100),
  lastName: z.string({ message: "Last name is required" }).trim().min(1, "Last name is required").max(100),
  mobileNum,
  email: z.string({ message: "Email is required" }).trim().email("Must be a valid email"),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
});

/** Admin edits to a contact's status (the only field the dashboard updates). */
export const updateStatusSchema = z.object({
  status: z.enum(["pending", "handled"]),
});

/** Admin edits to a booking's status — includes "cancelled", which frees its slot. */
export const updateBookingStatusSchema = z.object({
  status: z.enum(["pending", "handled", "cancelled"]),
});