import multer from "multer";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

// Memory storage — the file never touches the container's disk. We stream
// the buffer straight to Cloudinary in the controller, which also means
// there's nothing left behind for an ephemeral filesystem to lose.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    const error = new Error("Only JPEG, PNG, or WEBP images are allowed");
    error.statusCode = 400;
    return cb(error);
  }
  cb(null, true);
};

export const uploadPhoto = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
}).single("photo");