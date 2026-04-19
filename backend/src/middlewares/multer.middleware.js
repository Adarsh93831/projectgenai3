import fs from "fs";
import path from "path";

import multer from "multer";

const uploadDirectory = path.resolve("public/temp");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(uploadDirectory)) {
      fs.mkdirSync(uploadDirectory, { recursive: true });
    }

    cb(null, uploadDirectory);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const sanitizedName = file.originalname.replace(/\s+/g, "-");
    cb(null, `${uniqueSuffix}-${sanitizedName}`);
  },
});

const upload = multer({ storage });

export { upload };
