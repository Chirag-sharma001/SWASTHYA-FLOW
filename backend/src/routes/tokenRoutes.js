const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokenController');

router.post('/', tokenController.createToken);
router.post('/bulk-sync', tokenController.bulkSync);
router.get('/queue/:sessionId', tokenController.getQueue);
router.post('/:id/complete', tokenController.completeConsultation);

module.exports = router;
