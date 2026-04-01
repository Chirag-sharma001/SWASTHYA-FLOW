const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const tokenController = require('../controllers/tokenController');

router.post('/', sessionController.startSession);
router.get('/active', sessionController.getActiveSession);
router.post('/:id/end', sessionController.endSession);
router.post('/:id/call-next', tokenController.callNext);

module.exports = router;
