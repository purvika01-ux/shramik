// Adds demo contractor accounts (with a few labourers each) so the admin page has data to show.
// Tops the register up to 12 contractors in total – existing accounts are never changed.
// Run: npm run seed-contractors
// Every demo contractor logs in with SEED_PASSWORD from .env (default: demo123)
require('dotenv').config({ quiet: true })
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const Labourer = require('../models/Labourer')

const TARGET = 12

// name, email, how many labourers, account active?
const CONTRACTORS = [
  ['Sahil Builders', 'sahil@demo.com', 18, true],
  ['Gurdeep Construction', 'gurdeep@demo.com', 24, true],
  ['Amit Infra Works', 'amit@demo.com', 12, true],
  ['Harpreet Contractors', 'harpreet@demo.com', 30, true],
  ['Rakesh & Sons', 'rakesh@demo.com', 9, false],
  ['Manjit Civil Works', 'manjit@demo.com', 15, true],
  ['Vikas Thekedar', 'vikas@demo.com', 21, true],
  ['Sunita Enterprises', 'sunita@demo.com', 7, true],
  ['Kuldeep Road Works', 'kuldeep@demo.com', 26, false],
  ['Naveen Building Co.', 'naveen@demo.com', 11, true],
  ['Jaspal Brick Kiln', 'jaspal@demo.com', 35, true],
  ['Ravi Painters', 'ravi@demo.com', 6, true],
]

const FIRST = ['Ramesh', 'Suresh', 'Mahesh', 'Rajesh', 'Dinesh', 'Mukesh', 'Ganesh', 'Sunil', 'Anil', 'Vijay', 'Santosh', 'Manoj', 'Raju', 'Shankar', 'Sanjay', 'Ashok', 'Pradeep', 'Deepak', 'Balwinder', 'Harjit']
const LAST = ['Kumar', 'Yadav', 'Singh', 'Sharma', 'Verma', 'Patil', 'Chauhan', 'Gupta', 'Paswan', 'Mandal', 'Rajput', 'Saini']
const WAGES = [600, 650, 700, 750, 800, 850, 900]

const pad = (n) => String(n).padStart(3, '0')

async function seed() {
  await mongoose.connect(process.env.MONGO_URI)
  const password = await bcrypt.hash(process.env.SEED_PASSWORD || 'demo123', 10)

  let count = await User.countDocuments({ role: 'contractor' })
  let added = 0
  for (const [i, [name, email, labourers, isActive]] of CONTRACTORS.entries()) {
    if (count >= TARGET) break
    if (await User.exists({ email })) continue

    // Spread the join dates over the last few months so the list looks real
    const joined = new Date()
    joined.setDate(joined.getDate() - (CONTRACTORS.length - i) * 9)
    const joinedOn = joined.toLocaleDateString('en-CA')

    const user = await User.create({ name, email, password, role: 'contractor', isActive, nextLabourNo: labourers + 1, createdAt: joined })
    await Labourer.insertMany(
      Array.from({ length: labourers }, (_, n) => ({
        contractor: user._id,
        code: `L-${pad(n + 1)}`,
        name: `${FIRST[(n + i) % FIRST.length]} ${LAST[(n * 3 + i) % LAST.length]}`,
        mobile: `9${String(800000000 + i * 1000 + n).padStart(9, '0')}`,
        dailyWage: WAGES[(n + i) % WAGES.length],
        status: n % 9 === 8 ? 'inactive' : 'active',
        joinedOn,
      })),
    )
    count++
    added++
    console.log(`Added ${name} (${email}) with ${labourers} labourers`)
  }

  console.log(`${added} contractor(s) added – ${count} contractors in total`)
  await mongoose.disconnect()
}

seed().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
