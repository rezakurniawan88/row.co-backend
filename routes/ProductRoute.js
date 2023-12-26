import express from "express";
import { 
    getDataProducts,
    getSingleProduct,
    createProduct,
    updateProduct,
    deleteProduct
} from "../controllers/ProductController.js";
import upload from "../middleware/multer.js";

const route = express.Router();

route.get("/products", getDataProducts);
route.get("/product/:id", getSingleProduct);
route.post("/product", (req, res) => {
    upload.array('images', 3)(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      
      createProduct(req, res);
    });
  });
route.patch("/product/:id", (req, res) => {
    upload.array('images', 3)(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      
      updateProduct(req, res);
    });
  });
route.delete("/product/:id", deleteProduct);

export default route;