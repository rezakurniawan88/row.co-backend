import express from "express";
import { 
    getOrders,
    createOrder,
    deleteOrder,
    getOrdersByUserId,
    changeOrderStatus,
    getOrdersByBrandId,
} from "../controllers/OrderController.js";

const route = express.Router();

route.get("/orders", getOrders);
route.get("/orders/:userId", getOrdersByUserId);
route.get("/orders/brand/:brandId", getOrdersByBrandId);
route.post("/order", createOrder);
route.patch("/order/:orderId", changeOrderStatus);
route.delete("/order/:id", deleteOrder);

export default route;