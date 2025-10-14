const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const axios = require("axios");
const { app, server, io, chatSockets } = require("../server");

// ถาม
exports.ask = async (req, res) => {
  try {
    const { chatId, question, k, d, webhookUrl } = req.body;

    if (!question) {
      return res.status(400).json({ message: "Question is required." });
    }

    // 1. ส่ง request ไป main.py เพื่อสร้างงาน
    const resData = await axios.post(
      "http://" + process.env.AI_SERVER + ":" + process.env.AI_SERVER_PORT + "/ask",
      {
        args: [
          question,
          ...(k != null ? [`-k ${k}`] : []),
          ...(d != null ? [`-d ${d}`] : []),
        ],
        chatId: chatId,
      }
    );

    console.log("Response from AI server:", resData.data);
    const { taskId } = resData.data;

    if (!chatId) {
      res.status(202).json({
        message: "Task queued",
        taskId: taskId,
        chatId: chatId,
        question: resData.data.args[0],
        ...(k != null ? { k } : {}),
        ...(d != null ? { d } : {}),
      });
    } else {  
      const savedRecordQuestion = await prisma.qNa_tb.create({
        data: {
          chatId: parseInt(chatId),
          taskId: taskId,
          qNaWords: question,
          qNaType: "Q",
        },
      });

      res.status(202).json({
        data: savedRecordQuestion,
        message: "Task queued",
        taskId: taskId,
        chatId: savedRecordQuestion.chatId,
        question: resData.data.args[0],
        ...(k != null ? { k } : {}),
        ...(d != null ? { d } : {}),
      });
    }

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({
      message: "Unexpected error: " + error.message,
      stack: error.stack,
    });
  }
};

exports.saveAnswer = async (req, res) => {
  try {
    const { taskId, chatId, qNaWords } = req.body;

    if (!taskId) {
      return res.status(400).json({ message: "taskId is required." });
    }

    if (!chatId) {
      return res.status(400).json({ message: "chatId is required." });
    }

    if (!qNaWords) {
      return res.status(400).json({ message: "qNaWords is required." });
    }

    // บันทึกคำตอบ AI ลง qNa_tb
    const savedAnswer = await prisma.qNa_tb.create({
      data: {
        chatId: parseInt(chatId),
        taskId: parseInt(taskId),
        qNaWords: qNaWords,
        qNaType: "A",
      },
    });

    console.log("Saved AI answer:", savedAnswer);
    return res.status(201).json({ message: "AI answer saved", data: savedAnswer });

  } catch (err) {
    console.error("Error saving AI answer:", err);
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

exports.cancel = async (req, res) => {
  const { taskId } = req.params;

  if (!taskId) {
    return res.status(400).json({ message: "taskId is required" });
  }

  try {
    const response = await axios.post(
      "http://" + process.env.AI_SERVER + ":" + process.env.AI_SERVER_PORT + "/cancel/" + taskId
    );

    // ลบข้อมูลใน qNa_tb โดยอ้างอิงจาก taskId
    const deletedqNa = await prisma.qNa_tb.deleteMany({
      where: { taskId: taskId },
    });

    return res.status(200).json({
      message: "Cancel successful",
      taskId,
      deleted: deletedqNa.count,
      response: response.data,
    });
  } catch (error) {
    console.error("Error cancelling job:", error.message);
    return res.status(500).json({
      message: "Failed to cancel or delete job",
      error: error.message,
    });
  }
};


// ดึงข้อความแชททั้งหมด
exports.getAllqNa = async (req, res) => {
  try {
    const chats = await prisma.qNa_tb.findMany(); // ดึงข้อมูลทั้งหมดโดยไม่มีการกรอง
    res.status(200).json({ message: "All chats found", data: chats });
  } catch (error) {
    console.error("Error fetching chats: ", error);
    res.status(500).json({ message: "Error: " + error.message });
  }
};

// ดึงข้อความแชทของ user
exports.getqNaByUserId = async (req, res) => {
  try {
    const chats = await prisma.qNa_tb.findMany({
      where: { userId: Number(req.params.userId) },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ message: "ดึงข้อความแชทของผู้ใช้สำเร็จ", data: chats });
  } catch (error) {
    console.error("Error fetching chats by user: ", error);
    res.status(500).json({ message: "Error: " + error.message });
  }
};

// ดึงข้อความแชทของ user
exports.getqNaByChatId = async (req, res) => {
  try {
    const chats = await prisma.qNa_tb.findMany({
      where: {
        chatId: Number(req.params.chatId)
      },
      orderBy: { createdAt: "asc" },
    });
    res.status(200).json({ message: "ดึงข้อความแชทของผู้ใช้สำเร็จ", data: chats });
  } catch (error) {
    console.error("Error fetching chats by user: ", error);
    res.status(500).json({ message: "Error: " + error.message });
  }
};

// ดึงข้อความแชทเฉพาะข้อความเดียว
exports.getqNa = async (req, res) => {
  try {
    const chat = await prisma.qNa_tb.findUnique({
      where: { chatId: Number(req.params.chatId) },
      include: {
        user: {
          select: {
            userName: true,
            userImage: true,
          },
        },
      },
    });

    if (!chat) {
      return res.status(404).json({ message: "ข้อความแชทไม่พบ" });
    }

    res.status(200).json({
      message: "ข้อความแชทพบ",
      data: { chat, user: chat.user },
    });
  } catch (error) {
    console.error("Error fetching chat: ", error);
    res.status(500).json({ message: "Error: " + error.message });
  }
};

// ลบข้อความแชท
exports.deleteqNa = async (req, res) => {
  try {
    const chat = await prisma.qNa_tb.findUnique({
      where: { qNaId: Number(req.params.qNaId) },
    });

    if (!chat) {
      return res.status(404).json({ message: "ไม่พบ qNaID:" + req.params.qNaId });
    }

    const deletedqNa = await prisma.qNa_tb.delete({
      where: { qNaId: Number(req.params.qNaId) },
    });

    res.status(200).json({
      message: "ลบข้อความแชทสำเร็จ",
      data: deletedqNa,
    });
  } catch (error) {
    console.error("Error deleting qNa: ", error);
    res.status(500).json({ message: "Error: " + error.message });
  }
};

// เช็คสถานะงาน
exports.checkStatus = async (req, res) => {
  const { taskId } = req.params;
  try {
    const response = await axios.get("http://" + process.env.AI_SERVER + ":" + process.env.AI_SERVER_PORT + "/status/" + taskId);
    return res.status(200).json({
      message: "Status fetched successfully",
      taskId,
      responseData: response.data,
    });
  } catch (error) {
    console.error("Error fetching status: ", error.message);
    return res.status(500).json({
      message: "Failed to fetch status",
      error: error.message,
    });
  }
};