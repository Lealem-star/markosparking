const { Router } = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { isLoggedIn, validate } = require('../middleware');
const chatController = require('../controllers/chatController');

const router = Router();

router.get('/messages', isLoggedIn, asyncHandler(chatController.getMessages));
router.post('/messages', isLoggedIn, validate(chatController.sendMessageSchema), asyncHandler(chatController.sendMessage));

module.exports = router;
