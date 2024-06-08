import prisma from "../lib/prisma.js";
import fs from "fs";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import FormData from "form-data";
import Mailgun from "mailgun.js";
import Mailgen from "mailgen";

export const getUsers = async (req, res) => {
    try {
        const users = await prisma.users.findMany({
            orderBy: {
                id: "desc"
            }
        });
        return res.status(200).json({ data: users });
    } catch (error) {
        console.log(error);
    }
}

export const getBrandUsers = async (req, res) => {
    try {
        const brands = await prisma.users.findMany({
            where: {
                role: "BRAND"
            },
            select: {
                id: true,
                username: true,
                slug: true,
                email: true,
                profile_picture_url: true,
                products: true
            }
        });
        return res.status(200).json({ data: brands });
    } catch (error) {
        console.log(error);
    }
}

export const getUserBySlug = async (req, res) => {
    const { slug } = req.params;

    try {
        const user = await prisma.users.findUnique({
            where: {
                slug
            },
            select: {
                username: true,
                slug: true,
                email: true,
                role: true,
                profile_picture_url: true,
                products: true
            }
        });

        res.status(200).json({ data: user });
    } catch (error) {
        console.log(error);
    }
}

export const register = async (req, res) => {
    const { username, email, password, confirmPassword } = req.body;
    if(password !== confirmPassword) return res.status(400).json({message: "Password and Confirm Password must be the same"});

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);
    const slug = username.toLowerCase().replace(/\s+/g, '-');

    if (!req.file) {
        return res.status(400).json({ message: "No images uploaded" });
    }

    const images = req.file.filename;

    try {
        const user = await prisma.users.create({
            data: {
                username,
                slug,
                email,
                password: hashedPassword,
                profile_picture: images,
                profile_picture_url: `${process.env.BACKEND_URL}/images/profile/${images}`,
            }
        })

        res.status(201).json({message: "User Created Successfully", data: user});
    } catch (error) {
        console.log(error);
    }
}

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await prisma.users.findUnique({
            where: {
                email
            }
        })

        if(!user) return res.status(404).json({message: "Username or password is incorrect."});

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) return res.status(400).json({message: "Username or password is incorrect."});

        const accessToken = jwt.sign({
            userId: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            profile_picture_url: user.profile_picture_url
        }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "300s"
        });

        const refreshToken = jwt.sign({
            userId: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            profile_picture_url: user.profile_picture_url
        }, process.env.REFRESH_TOKEN_SECRET, {
            expiresIn: "1d"
        });

        await prisma.users.update({
            where: {
                email
            },
            data: {
                refresh_token: refreshToken
            }
        });

        res.cookie("refreshToken", refreshToken, {
            sameSite: "none",
            secure: true,
            httpOnly: true,
            maxAge: 24 * 60 * 60 * 1000
        });

        res.status(200).json({message: "Login Successfull", data: {accessToken}});


    } catch (error) {
        console.log(error);
    }
}

export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if(!refreshToken) return res.status(401).json({message: "No token provided"});
        const user = await prisma.users.findFirst({
            where: {
                refresh_token: refreshToken
            }
        });
        if(!user) return res.status(403).json({message: "Invalid token"});
        const userId = user.id;
        await prisma.users.update({
            where: {
                id: userId
            },
            data: {
                refresh_token: null
            }
        });
        res.clearCookie("refreshToken");
        return res.status(200).json({message: "Logout Successfull"});   
    } catch (error) {
        console.log(error);
    }
}

export const updateUser = async (req, res) => {
    const { userSlug } = req.params;
    const { username, email, role } = req.body;

    try {
        const user = await prisma.users.findUnique({
            where: {
                slug: userSlug
            }
        });

        if(!user) return res.status(404).json({message: "User not found"});
    
        let images = "";
        if(req.file) {
            fs.unlinkSync(`./public/images/profile/${user.profile_picture}`)
            images = req.file.filename;
        } else {
            images = user.profile_picture;
        }
        const slug = username.toLowerCase().replace(/\s+/g, '-');

        const updatedUser = await prisma.users.update({
            where: {
                slug: userSlug
            },
            data: {
                username,
                slug,
                email,
                role,
                profile_picture: images,
                profile_picture_url: `${process.env.BACKEND_URL}/images/profile/${images}`,
            }
        })

        return res.status(200).json({message: "User Updated Successfully", data: updatedUser});
    } catch (error) {
        console.log(error);
        res.status(500).json({message: "Internal Server Error"});
    }
}

export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if(!refreshToken) return res.status(401).json({message: "No token provided"});
        const user = await prisma.users.findFirst({
            where: {
                refresh_token: refreshToken
            } 
        });
        if(!user) return res.status(403).json({message: "Invalid token"});

        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
            if(err) return res.status(403).json({message: "Invalid token"});;
            const userId = user.id;
            const username = user.username;
            const email = user.email;
            const role = user.role;
            const profile_picture_url = user.profile_picture_url;
            const accessToken = jwt.sign({userId, username, email, role, profile_picture_url}, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: "20s"
            });
            res.json({data: {accessToken} });
        })
    } catch (error) {
        console.log(error);
    }
}

export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await prisma.users.findUnique({
            where: {
                email
            }
        });
        
        if(!user) return res.status(404).json({message: "Email not found"});
        
        const payload = {
            email: user.email,
            exp: Date.now() + 3600000, //1 hour
        }
        
        const resetToken = jwt.sign(payload, process.env.RESET_TOKEN_SECRET);
        const resetTokenURL = `${process.env.FRONTEND_URL}/auth/reset-password/${resetToken}`;

        const mailgun = new Mailgun(FormData);
        const mg = mailgun.client({username: 'api', key: process.env.MAILGUN_API_KEY});
        let mailGenerator = new Mailgen({
            theme: "default",
            product: {
              name: 'ROW.CO',
              link: process.env.FRONTEND_URL,
          }
        });
        
        var emailData = {
        body: {
            name: user.username,
            intro: 'You have received this email because a password reset request for your account was received.',
            action: {
                instructions: 'Click the button below to reset your password:',
                button: {
                    color: '#1d4ed8',
                    text: 'Reset your password',
                    link: resetTokenURL
                }
            },
            outro: 'If you did not request a password reset, no further action is required on your part.'
        }};
          
        mg.messages.create('sandbox886f1096c04d4beab51832400feb8464.mailgun.org', {
            from: 'ROW.CO <no-reply@sandbox886f1096c04d4beab51832400feb8464.mailgun.org>',
            to: user.email,
            subject: "Reset Password",
            text: mailGenerator.generatePlaintext(emailData),
            html: mailGenerator.generate(emailData)
        })
        .then(msg => console.log(msg))
        .catch(err => console.error(err));

        await prisma.users.update({
            where: {
                email
            },
            data: {
                reset_token: resetToken,
                reset_token_used: false,
            }
        });

        return res.status(200).json({
            message: "Reset Password Send",
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error." });
    }
}

export const resetPassword = async (req, res) => {
    const { token } = req.params;
    const { newPassword, confirmPassword } = req.body;

    try {
        const decoded = jwt.verify(token, process.env.RESET_TOKEN_SECRET);
        if(!decoded) return res.status(401).json({message: "Invalid or expired reset token"});

        const user = await prisma.users.findUnique({
            where: {
                email: decoded.email,
            }
        })

        if (!user) return res.status(404).json({ message: "User not found" });
        if(user.reset_token_used) return res.status(400).json({ message: "Reset token has already been used" });
        if (newPassword !== confirmPassword) return res.status(400).json({ message: "Passwords do not match" });

        const salt = await bcrypt.genSalt();
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await prisma.users.update({
            where: {
                email: user.email,
            },
            data: {
                password: hashedPassword,
                reset_token_used: true
            }
        })

        res.status(200).json({ message: "Password reset successfully"});
    } catch (error) {
        console.log(error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: "Invalid or expired reset token." });
        }
        res.status(500).json({ message: "Internal server error." });
    }
}

export const changeProfilePicture = async (req, res) => {
    const { userId } = req.params;

    const user = await prisma.users.findUnique({
        where: {
            id: parseInt(userId)
        }
    });
    if(!user) return res.status(404).json({message: "No user found"});

    if (!req.file) {
        return res.status(400).json({ message: "No images uploaded" });
    };

    let images = "";
    if(req.file) {
        fs.unlinkSync(`./public/images/profile/${user.profile_picture}`)
        images = req.file.filename;
    } else {
        images = user.profile_picture;
    }

    try {
        const user = await prisma.users.update({
            where: {
                id: parseInt(userId)
            },
            data: {
                profile_picture: images,
                profile_picture_url: `${process.env.BACKEND_URL}/images/profile/${images}`,
            }
        });

        res.status(201).json({message: "Changed Picture Successfully", data: user});
    } catch (error) {
        console.log(error);
    }
}

export const deleteUser = async (req, res) => {
    const { userId } = req.params;
    
    try {
        const user = await prisma.users.findUnique({
            where: {
                id: parseInt(userId)
            }
        })

        if(!user) return res.status(404).json({message: "User not found"});

        if(user.profile_picture) {
            fs.unlinkSync(`./public/images/profile/${user.profile_picture}`)
        }

        await prisma.users.delete({
            where: {
                id: parseInt(userId)
            }
        })

        res.status(200).json({message: "User deleted successfully"});
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error." });
    }
}