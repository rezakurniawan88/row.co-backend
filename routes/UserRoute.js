import express from "express";
import {
    getUsers,
    register,
    login,
    logout,
    refreshToken,
    changeProfilePicture,
    forgotPassword,
    resetPassword,
    getBrandUsers,
    getUserBySlug,
    deleteUser,
    updateUser
} from "../controllers/UserController.js";
import { profileUpload } from "../middleware/multer.js";

const route = express.Router();

route.get("/auth/users", getUsers);
route.get("/auth/users/brands", getBrandUsers);
route.get("/auth/users/:slug", getUserBySlug);
route.post("/auth/register", (req, res) => {
    profileUpload.single("profile_picture")(req, res, (err) => {
      if (err) {
        console.log(err);
        return res.status(400).json({ error: err.message });
      }
      
      register(req, res);
    });
  });
route.post("/auth/login", login);
route.delete("/auth/logout", logout);
route.patch("/auth/user/:userSlug", (req, res) => {
  profileUpload.single("profile_picture")(req, res, (err) => {
    if (err) {
      console.log(err);
      return res.status(400).json({ error: err.message });
    }
    
    updateUser(req, res);
  });
});
route.get("/auth/refresh-token", refreshToken);
route.patch("/auth/forgot-password", forgotPassword);
route.patch("/auth/reset-password/:token", resetPassword);
route.patch("/auth/user/change-profile-picture/:userId", (req, res) => {
  profileUpload.single("profile_picture")(req, res, (err) => {
    if (err) {
      console.log(err);
      return res.status(400).json({ error: err.message });
    }
    
    changeProfilePicture(req, res);
  });
});
route.delete("/auth/user/:userId", deleteUser);

export default route;