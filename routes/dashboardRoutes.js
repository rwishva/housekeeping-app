const express = require('express');
const { authenticateUser } = require('../middleware/authMiddleware');
const { getDashboard } = require('../controllers/dashboardController');

const router = express.Router();

router.get('/', authenticateUser, getDashboard);

module.exports = router;
