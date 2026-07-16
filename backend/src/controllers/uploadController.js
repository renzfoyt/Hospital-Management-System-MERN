import { asyncHandler } from "../utils/asyncHandler.js";
import cloudinary from "../config/cloudinary.js";

/**
 * Admin: upload a doctor profile photo to Cloudinary and return its URL.
 * Expects a single multipart field named "photo" (see middleware/upload.js).
 * This endpoint is single-purpose — it does NOT touch the Doctor document.
 * The frontend takes the returned url and sends it as photoUrl in the
 * normal create/update doctor request, so create/update stay plain JSON.
 */
export const uploadDoctorPhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No image file provided" });
  }

  const result = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "hms-mern/doctors",
        resource_type: "image",
        transformation: [{ width: 800, height: 800, crop: "limit" }],
      },
      (error, uploadResult) => {
        if (error) return reject(error);
        resolve(uploadResult);
      },
    );
    stream.end(req.file.buffer);
  }).catch((error) => {
    error.statusCode = 502;
    error.message = "Image upload failed. Please try again.";
    throw error;
  });

  res.status(200).json({ url: result.secure_url });
});