const { ForumChannel, ForumMessage, User } = require('../models');
const { Op } = require('sequelize');

exports.getChannels = async (req, res) => {
  try {
    const { role } = req.user;
    
    const userId = req.user.id;
    
    let whereClause = {
      [Op.or]: [
        { type: 'public' },
        { 
          type: 'direct',
          [Op.or]: [
            { directUserId1: userId },
            { directUserId2: userId }
          ]
        }
      ]
    };
    
    if (role === 'instructor' || role === 'superadmin') {
      whereClause[Op.or].push({ type: 'adminOnly' });
      // Admins can also see old legacy channels marked adminOnly
      whereClause[Op.or].push({ adminOnly: true });
    }

    const channels = await ForumChannel.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email'] }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.json(channels);
  } catch (error) {
    console.error('Error fetching forum channels:', error);
    res.status(500).json({ error: 'Failed to fetch channels' });
  }
};

exports.createChannel = async (req, res) => {
  try {
    const { name, description, adminOnly } = req.body;
    const { id: userId } = req.user;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Channel name is required' });
    }

    const isAdminOnly = adminOnly === true || adminOnly === 'true';

    const channel = await ForumChannel.create({
      name: name.trim(),
      description: description || null,
      adminOnly: isAdminOnly,
      type: isAdminOnly ? 'adminOnly' : 'public',
      createdBy: userId
    });

    res.status(201).json(channel);
  } catch (error) {
    console.error('Error creating forum channel:', error);
    res.status(500).json({ error: 'Failed to create channel' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { role } = req.user;

    const channel = await ForumChannel.findByPk(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    // Access control check
    if (channel.type === 'adminOnly' && role !== 'instructor' && role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied. Admin only channel.' });
    }

    if (channel.type === 'direct') {
      if (channel.directUserId1 !== req.user.id && channel.directUserId2 !== req.user.id && role !== 'instructor' && role !== 'superadmin') {
         return res.status(403).json({ error: 'Access denied to this direct message.' });
      }
    }

    const messages = await ForumMessage.findAll({
      where: { channelId },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'email', 'profilePicture', 'role'] }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};
