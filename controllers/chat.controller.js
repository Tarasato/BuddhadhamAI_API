const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// สร้างแชทใหม่
exports.createChat = async (req, res) => {
  try {
    const { userId, chatHeader } = req.body;

    if (!chatHeader) {
      return res.status(400).json({ message: "Chat header is required." });
    }

    const result = await prisma.chat_tb.create({
      data: {
        userId,
        chatHeader,
      },
    });

    res.status(201).json({
      message: "Chat created successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error creating chat: ", error);
    res.status(500).json({
      message: "Error: " + error.message,
      stack: error.stack,
    });
  }
};

// ดึงข้อความแชททั้งหมด
exports.getAllChats = async (req, res) => {
  try {
    const chats = await prisma.chat_tb.findMany(); // ดึงข้อมูลทั้งหมดโดยไม่มีการกรอง
    res.status(200).json({ message: "All chats found", data: chats });
  } catch (error) {
    console.error("Error fetching chats: ", error);
    res.status(500).json({ message: "Error: " + error.message });
  }
};

// ดึงข้อความแชทของ user
exports.getChatsByUserId = async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    const chats = await prisma.chat_tb.findMany({
      where: { userId },
    });

    const chatsWithQ = await Promise.all(
      chats.map(async (chat) => {
        const latestQ = await prisma.qNa_tb.findFirst({
          where: { chatId: chat.id },
          orderBy: { qNaId: "asc" }, // <- qNaId ล่าสุด
          select: { createdAt: true, qNaId: true },
        });
        return { ...chat, latestQ };
      })
    );

    res.status(200).json({
      message: "Fetch chat by user id successfully",
      data: chats,
    });
  } catch (error) {
    console.error("Error fetching chats by user: ", error);
    res.status(500).json({ message: "Error: " + error.message });
  }
};

// ดึงข้อความแชทเฉพาะข้อความเดียว
exports.getChat = async (req, res) => {
  try {
    const chat = await prisma.chat_tb.findUnique({
      where: { chatId: Number(req.params.chatId) },
      include: {
        user: {
          select: {
            userName: true,
          },
        },
      },
    });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    res.status(200).json({
      message: "Chat found",
      data: { chat, user: chat.user },
    });
  } catch (error) {
    console.error("Error fetching chat: ", error);
    res.status(500).json({ message: "Error: " + error.message });
  }
};

// แก้ไขข้อความแชท (ไม่มีรูปภาพ)
exports.editChat = async (req, res) => {
  try {
    const chat = await prisma.chat_tb.findFirst({
      where: { chatId: Number(req.params.chatId) },
    });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const updatedData = {
      chatHeader: req.body.chatHeader.toString(),
    };
    console.log(updatedData);
    const result = await prisma.chat_tb.update({
      where: { chatId: Number(req.params.chatId) },
      data: updatedData,
    });

    res.status(200).json({
      message: "Chat updated successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error updating chat: ", error);
    res.status(500).json({
      message: "Error: " + error.message,
      errorDetails: error.stack,
    });
  }
};


// ลบข้อความแชท
exports.deleteChat = async (req, res) => {
  try {
    const chatId = Number(req.params.chatId);

    const chat = await prisma.chat_tb.findUnique({
      where: { chatId },
    });

    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // ลบ qNa_tb ที่อ้างอิง chatId ก่อน
    await prisma.qNa_tb.deleteMany({
      where: { chatId },
    });

    // ค่อยลบ chat_tb
    const deletedChat = await prisma.chat_tb.delete({
      where: { chatId },
    });

    res.status(200).json({
      message: "Chat deleted successfully",
      data: deletedChat,
    });
  } catch (error) {
    console.error("Error deleting chat: ", error);
    res.status(500).json({ message: "Error: " + error.message });
  }
};
