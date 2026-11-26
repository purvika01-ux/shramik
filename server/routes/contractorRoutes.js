const express = require('express')
const { protect, allowRoles } = require('../middleware/auth')
const { getLabourers, addLabourer, updateLabourer, deleteLabourer } = require('../controllers/labourerController')
const { getAttendance, saveAttendance } = require('../controllers/attendanceController')
const { getTransactions, addTransaction, deleteTransaction } = require('../controllers/transactionController')
const { monthlyReport } = require('../controllers/reportController')
const { updateSettings, clearData, importData } = require('../controllers/settingsController')

const router = express.Router()

// Every route below needs a logged-in, active contractor
router.use(protect, allowRoles('contractor'))

router.get('/labourers', getLabourers)
router.post('/labourers', addLabourer)
router.put('/labourers/:id', updateLabourer)
router.delete('/labourers/:id', deleteLabourer)

router.get('/attendance', getAttendance)
router.post('/attendance', saveAttendance)

router.get('/transactions', getTransactions)
router.post('/transactions', addTransaction)
router.delete('/transactions/:id', deleteTransaction)

router.get('/reports/monthly', monthlyReport)

router.put('/settings', updateSettings)
router.post('/data/import', importData)
router.delete('/data', clearData)

module.exports = router
