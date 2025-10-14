
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
    // hash password แบบ promise
    const hashedPassword = await bcrypt.hash(req.body.userPassword, SALT_ROUNDS);
    console.log("Hashed Password:", hashedPassword);

    // สร้าง user ใน DB
    const result = await prisma.user_tb.create({
      data: {
        userName: req.body.userName,
        userEmail: req.body.userEmail,
        userPassword: hashedPassword,
      },
    });
    console.log("Create user result:", result);
    console.log("UserPassword:", req.body.userPassword);

    res.status(201).json({
      message: "User created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({
      message: error.message,
    });
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
    const user = await prisma.user_tb.findFirst({
      where: {
        OR: [
          { userEmail: input },
          { userName: input }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid Email or Username" });
    }

    const isMatch = await bcrypt.compare(userPassword, user.userPassword);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid Email, Username or Password" });
    }

    res.status(200).json({
      message: "User login successfully",
      user: {
        id: user.userId,
        name: user.userName,
        email: user.userEmail,
      },
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: error.message });
  }
};
