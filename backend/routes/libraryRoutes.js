const express = require('express');
const { getLibraryItems, createLibraryItem, approveLibraryItem, deleteLibraryItem } = require('../controllers/libraryController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET all approved library items (or all items if admin/superadmin)
router.get('/', authenticateToken, getLibraryItems);

// POST create a new library item (needs approval if student)
router.post('/', authenticateToken, createLibraryItem);

// PUT approve a library item
router.put('/:id/approve', authenticateToken, requireAdmin, approveLibraryItem);

// DELETE a library item
router.delete('/:id', authenticateToken, requireAdmin, deleteLibraryItem);

module.exports = router;
