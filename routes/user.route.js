const express = require("express");
const userCtrl = require("./../controllers/user.controller.js");
const router = express.Router();

// Route definitions
router.post("/", userCtrl.createUser);
router.post("/login", userCtrl.checkLoginUser);

module.exports = router;
