const multer = require("multer");
const path = require("path");
const fs = require("fs");

const { PrismaClient } = require("@prisma/client"); //Models
const prisma = new PrismaClient();

// npm install bcrypt
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12; // ปรับได้ตามต้องการ

// สร้างบัญชีผู้ใช้งานใหม่ 
exports.createUser = async (req, res) => {
  try {
    const { userName, userEmail, userPassword } = req.body;

    if (!userName || !userEmail || !userPassword) {
      return res.status(400).json({ message: "Please enter username email and password" });
    }

    const inputEmail = userEmail.trim().toLowerCase();
    const inputUserName = userName.trim();

    // 1️⃣ เช็คว่า email หรือ username ซ้ำไหม
    // เช็ค email ซ้ำ
    const emailExists = await prisma.user_tb.findFirst({
      where: { userEmail: inputEmail }
    });

    // เช็ค username ซ้ำ
    const usernameExists = await prisma.user_tb.findFirst({
      where: { userName: inputUserName }
    });

    // คืน response ตาม field ที่ซ้ำจริง
    if (emailExists && usernameExists) {
      return res.status(409).json({ message: "Email and Username are already exists" });
    } else if (emailExists) {
      return res.status(409).json({ message: "Email is already exists" });
    } else if (usernameExists) {
      return res.status(409).json({ message: "Username is already exists" });
    }

    // 2️⃣ hash password
    const hashedPassword = await bcrypt.hash(userPassword, SALT_ROUNDS);
    // console.log("Hashed Password:", hashedPassword);

    // 3️⃣ สร้าง user
    const newUser = await prisma.user_tb.create({
      data: {
        userName: inputUserName,
        userEmail: inputEmail,
        userPassword: hashedPassword
      },
    });

    // console.log("Create user result:", newUser);

    // 4️⃣ ส่ง response (ไม่ส่ง password กลับ)
    res.status(201).json({
      message: "Create account successfully",
      data: {
        id: newUser.userId,
        name: newUser.userName,
        email: newUser.userEmail
      }
    });

  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ message: error.message });
  }
};


// ตรวจสอบการเข้าสู่ระบบ 
exports.checkLoginUser = async (req, res) => {
  try {
    const { userInput, userPassword } = req.body;

    if (!userInput || !userPassword) {
      return res.status(400).json({ message: "Please enter username or email and password" });
    }

    const input = userInput.trim().toLowerCase();
    const userData = await prisma.user_tb.findFirst({
      where: {
        OR: [
          { userEmail: input },
          { userName: input }
        ]
      },
      select: {
        userId: true,
        userName: true,
        userEmail: true,
        userPassword: true
      }
    });

    if (!userData) {
      return res.status(401).json({ message: "Invalid username or email" });
    }

    const isMatch = await bcrypt.compare(userPassword, userData.userPassword);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email username or password" });
    }
    // console.log("UserData:", userData);

    const responseUser = {
      id: userData.userId,
      name: userData.userName,
      email: userData.userEmail,
      password: userData.userPassword
    };

    console.log("Response User:", responseUser);

    res.status(200).json({
      user: responseUser,
      message: "Login successfully"
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: error.message });
  }
};
