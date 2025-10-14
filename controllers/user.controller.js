
// ไฟล์ที่เขียนการดำเนินการควบคุมสำหรับตารางในฐานข้อมูล
//เช่น insert, update, delete, select
//ไฟล์นี้ทำงานกับ user_tb
const multer = require("multer");
const path = require("path");
const fs = require("fs");

//ใช้ Prisma เพื่อทำงานร่วมกับ DB
const { PrismaClient } = require("@prisma/client"); //Models
const prisma = new PrismaClient();

// สร้างผู้ใช้งานใหม่ 
// npm install bcrypt
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12; // ปรับได้ตามต้องการ

exports.createUser = async (req, res) => {
  try {
    const { userName, userEmail, userPassword } = req.body;

    if (!userName || !userEmail || !userPassword) {
      return res.status(400).json({ message: "กรอกชื่อผู้ใช้ อีเมล และรหัสผ่านให้ครบ" });
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
      return res.status(409).json({ message: "อีเมลและชื่อผู้ใช้นี้มีผู้ใช้แล้ว" });
    } else if (emailExists) {
      return res.status(409).json({ message: "อีเมลนี้มีผู้ใช้แล้ว" });
    } else if (usernameExists) {
      return res.status(409).json({ message: "ชื่อผู้ใช้นี้มีผู้ใช้แล้ว" });
    }

    // 2️⃣ hash password
    const hashedPassword = await bcrypt.hash(userPassword, SALT_ROUNDS);
    console.log("Hashed Password:", hashedPassword);

    // 3️⃣ สร้าง user
    const newUser = await prisma.user_tb.create({
      data: {
        userName: inputUserName,
        userEmail: inputEmail,
        userPassword: hashedPassword
      },
    });

    console.log("Create user result:", newUser);

    // 4️⃣ ส่ง response (ไม่ส่ง password กลับ)
    res.status(201).json({
      message: "User created successfully",
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
      return res.status(400).json({ message: "userEmail or userName and userPassword are required." });
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
      return res.status(401).json({ message: "Invalid Email or Username" });
    }

    const isMatch = await bcrypt.compare(userPassword, userData.userPassword);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid Email, Username or Password" });
    }
    console.log("UserData:", userData);

    const responseUser = {
      id: userData.userId,
      name: userData.userName,
      email: userData.userEmail,
      password: userData.userPassword
    };

    console.log("Response User:", responseUser);

    res.status(200).json({
      user: responseUser,
      message: "User login successfully"
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: error.message });
  }
};
