import express from "express";
import dotenv from "dotenv";
import cors from "cors";
dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.status(200).json({
        "message": "Welcome to the API"
    })
})

app.listen(process.env.APP_PORT, () => console.log(`Server is running on port ${process.env.APP_PORT}`));