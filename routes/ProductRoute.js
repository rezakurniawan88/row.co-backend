import express from "express";
import { 
    getDataProducts,
    getSingleProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    getDataProductsByUserId,
    getDataDashboardProductsByUserId,
    getTopSelling,
} from "../controllers/ProductController.js";
import { upload } from "../middleware/multer.js";
import { authMiddleware } from "../middleware/auth.js";

const route = express.Router();

route.get("/products/top-selling", getTopSelling);
route.get("/products", getDataProducts);
route.get("/products/:userId", getDataProductsByUserId);
route.get("/dashboard/products/:userId", getDataDashboardProductsByUserId);
route.get("/product/:slug", getSingleProduct);
route.post("/product", (req, res) => {
    upload.array('images', 3)(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      
      createProduct(req, res);
    });
  });
route.patch("/product/:slug", authMiddleware(["ADMIN", "BRAND"]), (req, res) => {
    upload.array('images', 3)(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      
      updateProduct(req, res);
    });
  });
route.delete("/product/:id", deleteProduct);

export default route;