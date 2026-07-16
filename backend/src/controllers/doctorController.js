import { Doctor } from "../../models/Doctor.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { paginate } from "../utils/paginate.js";

/**
 * @typedef {Object} DoctorRequestBody
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} specialty
 * @property {string} [subSpecialty]
 * @property {string} department
 * @property {string} [credentials]
 * @property {string} [bio]
 * @property {string} [photoUrl]
 * @property {string} [email]
 * @property {string} [contactNumber]
 * @property {"Male"|"Female"} [gender]
 * @property {string[]} [clinicDays]
 * @property {string} [clinicHourIn]
 * @property {string} [clinicHourOut]
 * @property {string[]} [hmoAccepted]
 * @property {string[]} [availability]
 * @property {"active"|"inactive"} [status]
 */

/* ---------------------- PUBLIC ---------------------- */

/**
 * Public: get all active doctors, or one doctor by id
 * Used by the "Find a Doctor" page on the frontend
 * @param {import("express").Request<{ id?: string }>} req
 * @param {import("express").Response} res
 */
export const getDoctors = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (id) {
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    return res.status(200).json(doctor);
  }

  // Public listing only shows active doctors
  const doctors = await Doctor.find({ status: "active" }).sort({ lastName: 1 });
  res.status(200).json(doctors);
});

/* ---------------------- ADMIN: DOCTORS ---------------------- */

/**
 * Admin: create a new doctor. Body shape is already validated/whitelisted
 * by createDoctorSchema before this runs.
 * @param {import("express").Request<{}, {}, DoctorRequestBody>} req
 * @param {import("express").Response} res
 */
export const adminCreateDoctor = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    specialty,
    subSpecialty,
    department,
    credentials,
    bio,
    photoUrl,
    email,
    contactNumber,
    gender,
    clinicDays,
    clinicHourIn,
    clinicHourOut,
    hmoAccepted,
    availability,
    status,
  } = req.body;

  const newDoctor = new Doctor({
    firstName,
    lastName,
    specialty,
    subSpecialty,
    department,
    credentials,
    bio,
    photoUrl,
    email,
    contactNumber,
    gender,
    clinicDays,
    clinicHourIn,
    clinicHourOut,
    hmoAccepted,
    availability,
    status,
  });

  await newDoctor.save();

  res.status(201).json({
    message: "Doctor created successfully",
    doctor: newDoctor,
  });
});

/**
 * Admin: get all doctors (including inactive), or one doctor by id
 * @param {import("express").Request<{ id?: string }>} req
 * @param {import("express").Response} res
 */
export const adminGetDoctors = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (id) {
    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    return res.status(200).json(doctor);
  }

  const { items: doctors, total } = await paginate(Doctor, {
    sort: { lastName: 1 },
    req,
  });

  res.set("X-Total-Count", total);
  res.status(200).json(doctors);
});

/**
 * Admin: update a doctor by id
 * @param {import("express").Request<{ id: string }, {}, Partial<DoctorRequestBody>>} req
 * @param {import("express").Response} res
 */
export const adminUpdateDoctor = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const updatedDoctor = await Doctor.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!updatedDoctor) {
    return res.status(404).json({ message: "Doctor not found" });
  }

  res.status(200).json({
    message: "Doctor updated successfully",
    doctor: updatedDoctor,
  });
});

/**
 * Admin: delete a doctor by id
 * @param {import("express").Request<{ id: string }>} req
 * @param {import("express").Response} res
 */
export const adminDeleteDoctor = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deletedDoctor = await Doctor.findByIdAndDelete(id);

  if (!deletedDoctor) {
    return res.status(404).json({ message: "Doctor not found" });
  }

  res.status(200).json({ message: "Doctor deleted successfully" });
});
