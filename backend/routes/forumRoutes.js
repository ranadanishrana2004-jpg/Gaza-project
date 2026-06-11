const express = require('express');
const { getChannels, createChannel, getMessages } = require('../controllers/forumController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET all channels accessible to user
router.get('/channels', authenticateToken, getChannels);

// POST create a channel (only admins/superadmins can create channels per requirements)
router.post('/channels', authenticateToken, requireAdmin, createChannel);

// GET messages for a channel
router.get('/channels/:channelId/messages', authenticateToken, getMessages);

module.exports = router;
