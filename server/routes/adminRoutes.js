const express = require('express')
const { protect, allowRoles } = require('../middleware/auth')
const { getContractors, setContractorStatus } = require('../controllers/adminController')

const router = express.Router()

// Every route below needs a logged-in admin
router.use(protect, allowRoles('admin'))

router.get('/contractors', getContractors)
router.patch('/contractors/:id/status', setContractorStatus)

module.exports = router
