import path from "path";
import fs from "fs";
import multer from "multer";

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = 'public/images/';
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    },
  });

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 6000000
  },
  fileFilter: (req, file, cb) => {
    if(!file.originalname.match(/\.(jpg|jpeg|png|webp)$/)) {
      return cb(new Error("Only image are allowed!"));
    }
    cb(null, true);
  }
});


export default upload;