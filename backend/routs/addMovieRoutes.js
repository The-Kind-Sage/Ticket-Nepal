import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import AddMovieController from "../controllers/AddMovieController.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "uploads/";
    if (file.fieldname === "poster") folder += "posters";
    else if (file.fieldname === "backdrop") folder += "backdrops";
    else if (file.fieldname === "castImages") folder += "cast/";

    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

const cpUpload = upload.fields([
  { name: "poster", maxCount: 1 },
  { name: "backdrop", maxCount: 1 },
  { name: "castImages", maxCount: 20 },
]);

router.post("/add", cpUpload, AddMovieController.addMovie);
router.get("/all", AddMovieController.getAllMovies);
router.delete("/:id", AddMovieController.deleteMovie);
router.put("/:id", AddMovieController.updateMovie);

export default router;