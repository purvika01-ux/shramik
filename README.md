# ShramikKhata – Digital Labour Register (MERN)

A web app for a building contractor to keep a register of labourers: daily attendance (full day, half day, by hours, extra hours), wages, advances, payments and monthly reports (with PDF). Available in English, Hindi and Punjabi.

**Stack:** React (Vite) · Node.js + Express · MongoDB + Mongoose · JWT + bcrypt · Axios

## Roles

| Role | Can do |
|---|---|
| **Contractor** | Register, log in, manage **their own** labourers, attendance, advances/payments, reports, settings, logout |
| **Admin** | Log in, see all registered contractors, activate / deactivate contractor accounts |

A deactivated contractor cannot log in, and anyone already logged in is logged out on their next request. Their data is kept.

---

## 1. Folder structure

```
contractor/
├── index.html, vite.config.js, package.json   ← React frontend (Vite)
├── src/
│   ├── api/axios.js            ← Axios instance: base URL /api + adds the JWT to every request
│   ├── context/
│   │   ├── AuthContext.jsx     ← who is logged in, login / register / logout
│   │   └── DataContext.jsx     ← loads the contractor's data from the API, add/edit/delete actions
│   ├── pages/
│   │   ├── AuthPage.jsx        ← Login + Register
│   │   ├── AdminDashboard.jsx  ← Admin: contractor list
│   │   ├── Dashboard.jsx, Labour.jsx, Attendance.jsx, HisabKitab.jsx, Reports.jsx
│   ├── components/             ← forms, lists, modal, sidebar, settings …
│   ├── utils/calculations.js   ← wage and balance formulas used by the screens
│   ├── utils/backup.js         ← backup file download / restore helpers
│   ├── data/demoData.js        ← sample data for "Reset demo data"
│   └── i18n/                   ← English / Hindi / Punjabi text
└── server/                     ← Express backend
    ├── server.js               ← starts Express, connects MongoDB, mounts routes
    ├── config/db.js            ← mongoose.connect()
    ├── models/                 ← User, Labourer, Attendance, Transaction
    ├── middleware/auth.js      ← protect (checks JWT) + allowRoles('admin' | 'contractor')
    ├── controllers/            ← the code behind each API
    ├── routes/                 ← authRoutes, contractorRoutes, adminRoutes
    ├── utils/wage.js           ← wage formulas (same rules as the frontend)
    └── scripts/createAdmin.js  ← creates the admin account
```

## 2. How it works

**React → Express.** Pages never call the server directly. They use `useData()` (for example `addLabour(form)`). `DataContext` sends the request with Axios (`api.post('/labourers', form)`), then reloads the data so the screen shows what is saved in MongoDB. In development, Vite forwards every `/api/...` request to Express on port 5000 (`vite.config.js → server.proxy`).

**Express → MongoDB.** Each route runs a controller function, and the controller uses a Mongoose model, for example `Labourer.find({ contractor: req.user._id })`. Mongoose turns that into a MongoDB query and returns plain JavaScript objects, which the controller sends back as JSON.

**JWT authentication.**
1. On register or login, the server checks the password with **bcrypt**. Passwords are stored only as bcrypt hashes.
2. It creates a **JWT** signed with `JWT_SECRET` that holds the user's id and role, valid for 7 days.
3. React saves the token in `localStorage`, and Axios sends it with every request as `Authorization: Bearer <token>`.
4. The `protect` middleware verifies the token, loads the user from MongoDB, rejects deactivated accounts, and puts the user on `req.user`.
5. If the server answers **401**, React logs the user out.

**Role-based access** is enforced on the **backend**:
- `/api/admin/*` uses `allowRoles('admin')`.
- All register APIs use `allowRoles('contractor')`.
- Every query also filters by `contractor: req.user._id`, so contractor B can never read, edit, pay or delete contractor A's records. Trying it returns 404.

On the frontend, `App.jsx` shows the Login page, the Admin page or the register, depending on `user.role`.

**Attendance and wages.** There is one entry per labourer per day, enforced by a unique index on `{ labourer, date }`.

| Type | Wage |
|---|---|
| P – Full Day | daily wage + extra hours × hourly rate |
| H – Half Day | daily wage × 0.5 |
| T – By hours | hours × hourly rate |
| A – Absent | 0 |

- **Hourly rate** = daily wage ÷ working hours in a full day (default 8). Example: ₹800/day → ₹100/hr, so a full day + 3 extra hours = ₹1,100.
- When an entry is first saved, it **stores the wage and hours-per-day used at that time**, so a later pay rise never changes old earnings.
- If you change a saved entry, you must give a reason. The old value, new value and reason are kept in the entry's `corrections`.
- **Balance** = Wages − Advances − Payments.
- **Monthly report:** Balance due = Previous balance + Wages − Advances − Payments.

## 3. Database models

| Model | Stores |
|---|---|
| **User** | name, email, bcrypt password hash, role (`admin`/`contractor`), isActive, hoursPerDay setting, nextLabourNo (for L-001 codes) |
| **Labourer** | contractor (User id), code (`L-001`), name, mobile, dailyWage, status (`active`/`inactive`), joinedOn |
| **Attendance** | contractor, labourer, date, status (P/H/T/A), extraHours, hours, wage and hoursPerDay at the time, corrections [from, to, reason, at] |
| **Transaction** | contractor, labourer, type (`advance`/`payment`), amount, date, method (Cash/UPI/Bank Transfer), remarks |

Every record except User stores the contractor's user id.

## 4. REST API

| Method | URL | Who | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | public | Contractor sign-up |
| POST | `/api/auth/login` | public | Login (admin or contractor) |
| GET | `/api/auth/me` | logged in | Current user |
| GET / POST | `/api/labourers` | contractor | List / add labourers |
| PUT / DELETE | `/api/labourers/:id` | contractor | Edit (or activate/deactivate) / delete a labourer and their records |
| GET / POST | `/api/attendance` | contractor | List entries (`?from=&to=`) / save one day |
| GET / POST | `/api/transactions` | contractor | List / add advance or payment |
| DELETE | `/api/transactions/:id` | contractor | Delete an advance or payment |
| GET | `/api/reports/monthly?month=YYYY-MM&labourerId=all` | contractor | Monthly report |
| PUT | `/api/settings` | contractor | Working hours in a full day |
| POST | `/api/data/import` | contractor | Restore backup / load demo data |
| DELETE | `/api/data` | contractor | Clear all my data |
| GET | `/api/admin/contractors` | admin | All contractors |
| PATCH | `/api/admin/contractors/:id/status` | admin | `{ "isActive": true/false }` |

---

## 5. How to run

**Requirements:** Node.js 18+ and MongoDB Community Server, running locally.

### First time only

```powershell
npm install
npm --prefix server install
copy server\.env.example server\.env
npm --prefix server run create-admin
```

Before running `create-admin`, edit `server\.env` and set your own `JWT_SECRET` and admin password. `create-admin` creates the admin account from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `server\.env`.

### Start MongoDB

Use **one** of these:

```powershell
net start MongoDB
```

That needs an Administrator terminal. Without admin rights, run MongoDB with a data folder in your user profile instead:

```powershell
mkdir $HOME\mongo-data -Force; & "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe" --dbpath "$HOME\mongo-data"
```

### Start the app (two terminals)

```powershell
npm run server
```

```powershell
npm run dev
```

Open **http://localhost:5173**.

- **Admin:** the email and password from `server\.env` (default `admin@contractor.com` / `admin123`).
- **Contractor:** click **Register** to create an account. Use Settings → **Reset demo data** to load 30 sample labourers.
