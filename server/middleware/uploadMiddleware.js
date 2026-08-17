import multer from "multer";

// Keep the file in memory as a buffer — we need it directly for EXIF
// extraction and AI classification before deciding where/whether to save it
// to disk, so there's no benefit to writing it to disk first.
const storage = multer.memoryStorage();

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function fileFilter(req, file, cb) {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, and WEBP images are allowed"));
  }
}

export const uploadImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB, matches the original .NET limit
});
