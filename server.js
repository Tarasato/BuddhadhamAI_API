const express = require('express');
const cors = require("cors");
const http = require("http");
const { Server } = require('socket.io');

const chatRoutes = require("./routes/chat.route.js");
const qNaRoutes = require("./routes/qNa.route.js");
const userRoute = require("./routes/user.route");
require("dotenv").config();

const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);
const allowedOrigins = process.env.ORIGIN
const io = new Server(server, {
  cors: {
    origin: [allowedOrigins],
    methods: ["GET", "POST"]
  }
  // allow all origins (not recommended for production)
  // cors: {
  //   origin: (origin, callback) => {
  //     console.log("🔍 Origin:", origin)
  //     callback(null, true)
  //   },
  //   credentials: true,
  //   methods: ["GET", "POST"]
  // }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/user", userRoute);
app.use("/chat", chatRoutes);
app.use("/qNa", qNaRoutes);

// Static files (ถ้ามี)
// app.use("/images/user", express.static("images/user"));
// app.use("/images/place", express.static("images/place"));

// Basic test route
app.get("/", (req, res) => {
  res.json({ message: "Hello from BuddhamAI_UAT server!" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ message: "Something went wrong! Please try again later." });
});

io.on('connect', (socket) => {
  console.log('User connected');
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });

  socket.on("task", (payload) => {
    console.log('Task received:', payload);
    // console.log('taskId:', payload.taskId);
    io.emit(`${payload.taskId}`, payload.message);
    console.log('Emitted to:', `${payload.taskId}`);
  })

  socket.on("BuddhamAI", (msg) => {
    console.log('Socket :', msg);
  })

  socket.on("debug", (msg) => {
    io.emit("debug", msg);
  })
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT} with Socket.IO...`);
});