const express = require('express');
const router = express.Router();
const { getPlans, getMyPlan } = require('../controllers/planController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', getPlans);
router.get('/my-plan', protect, getMyPlan);

module.exports = router;
