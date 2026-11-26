const mongoose = require('mongoose')
const Transaction = require('../models/Transaction')
const Labourer = require('../models/Labourer')

const METHODS = ['Cash', 'UPI', 'Bank Transfer']

// GET /api/transactions – all advances and payments of the logged-in contractor
async function getTransactions(req, res) {
  const transactions = await Transaction.find({ contractor: req.user._id }).sort({ date: -1, createdAt: -1 })
  res.json(transactions)
}

// POST /api/transactions  body: { labourerId, type, amount, date, method?, remarks? }
async function addTransaction(req, res) {
  const { labourerId, type, date, method, remarks } = req.body
  const amount = Number(req.body.amount)

  if (!['advance', 'payment'].includes(type)) return res.status(400).json({ message: 'Type must be advance or payment' })
  if (!(amount > 0 && amount <= 1000000)) return res.status(400).json({ message: 'Enter a valid amount' })
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) return res.status(400).json({ message: 'A valid date is required' })
  if (!mongoose.isValidObjectId(labourerId)) return res.status(400).json({ message: 'Select a labourer' })

  // The labourer must belong to this contractor
  const labourer = await Labourer.findOne({ _id: labourerId, contractor: req.user._id })
  if (!labourer) return res.status(404).json({ message: 'Labourer not found' })

  const transaction = await Transaction.create({
    contractor: req.user._id,
    labourer: labourer._id,
    type,
    amount,
    date,
    method: type === 'payment' ? (METHODS.includes(method) ? method : 'Cash') : '',
    remarks: remarks || '',
  })
  res.status(201).json(transaction)
}

// DELETE /api/transactions/:id
async function deleteTransaction(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Entry not found' })
  const deleted = await Transaction.findOneAndDelete({ _id: req.params.id, contractor: req.user._id })
  if (!deleted) return res.status(404).json({ message: 'Entry not found' })
  res.json({ message: 'Entry deleted' })
}

module.exports = { getTransactions, addTransaction, deleteTransaction }
