import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import { validate } from "../middleware/validate.js";
import { createDoctorSchema, updateDoctorSchema } from "../schemas/doctorSchema.js";
import { uploadPhoto } from "../middleware/upload.js";

import {
  getDoctors,
  adminCreateDoctor,
  adminGetDoctors,
  adminUpdateDoctor,
  adminDeleteDoctor,
} from "../controllers/doctorController.js";
import { uploadDoctorPhoto } from "../controllers/uploadController.js";

const router = express.Router();

// Public: Find a Doctor page
router.get("/doctors", getDoctors);
router.get("/doctors/:id", getDoctors);

// Admin: doctors CRUD
router.post("/admin/doctors", verifyToken, validate(createDoctorSchema), adminCreateDoctor);
router.get("/admin/doctors", verifyToken, adminGetDoctors);
router.get("/admin/doctors/:id", verifyToken, adminGetDoctors);
router.put("/admin/doctors/:id", verifyToken, validate(updateDoctorSchema), adminUpdateDoctor);
router.delete("/admin/doctors/:id", verifyToken, adminDeleteDoctor);

// Admin: photo upload — returns a Cloudinary URL to include as photoUrl
// in a create/update request above, doesn't modify a doctor itself.
router.post("/admin/doctors/upload-photo", verifyToken, uploadPhoto, uploadDoctorPhoto);

export default router;