import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import ProductRoute from "./routes/ProductRoute.js";
import UserRoute from "./routes/UserRoute.js";
import OrderRoute from "./routes/OrderRoute.js";
import AddressRoute from "./routes/AddressRoute.js";

dotenv.config();
const app = express();

app.use(cors({
    origin: ['http://localhost:3000'],
    credentials: true,
}));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use(ProductRoute);
app.use(UserRoute);
app.use(OrderRoute);
app.use(AddressRoute);

app.listen(process.env.APP_PORT, () => console.log(`Server is running on port ${process.env.APP_PORT}`));