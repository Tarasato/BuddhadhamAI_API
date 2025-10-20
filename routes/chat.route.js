const express = require('express');
const chatCtrl = require('../controllers/chat.controller.js');
const router = express.Router();

// Route definitions
router.post("/", chatCtrl.createChat);
router.put("/:chatId", chatCtrl.editChat);
router.get("/all/:userId", chatCtrl.getChatsByUserId);  
router.get("/one/:chatId", chatCtrl.getChat);  
router.get("/all", chatCtrl.getAllChats); 
router.delete("/:chatId", chatCtrl.deleteChat); 

module.exports = router;