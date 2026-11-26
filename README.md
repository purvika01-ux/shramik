# ShramikKhata – Digital Labour Register

A MERN stack web app for contractors to manage labourers, daily attendance, wages, advances, payments and monthly reports (with PDF download). Available in English, Hindi and Punjabi.

**Tech stack:** React (Vite), Node.js, Express, MongoDB (Mongoose), JWT, bcrypt, Axios

## Features

- **Contractor:**
  - Register and log in.
  - Manage their own labourers, attendance, advances and payments.
  - View monthly reports and download them as PDF.
- **Admin:**
  - View all registered contractors.
  - Activate or deactivate their accounts.
- Each contractor can only see their own data. This is checked on the server.

## Wage calculation

| Attendance | Wage |
|---|---|
| Full Day | Daily wage + extra hours × hourly rate |
| Half Day | Daily wage × 0.5 |
| By Hours | Hours worked × hourly rate |
| Absent | 0 |

- **Hourly rate** = Daily wage ÷ working hours in a day (default 8)
- **Balance** = Wages − Advances − Payments

## Project structure

```
├── src/          React frontend (pages, components, context, utils)
└── server/       Express backend
    ├── models/       User, Labourer, Attendance, Transaction
    ├── controllers/  API logic
    ├── routes/       API routes
    └── middleware/   JWT authentication and role check
```

## How to run

**Requirements:** Node.js 18+ and MongoDB running locally.

**1. Install dependencies**

```powershell
npm install
```

```powershell
npm --prefix server install
```

**2. Set up the backend**

```powershell
copy server\.env.example server\.env
```

Open `server\.env` and set your own `JWT_SECRET` and `ADMIN_PASSWORD`. Then create the admin account:

```powershell
npm --prefix server run create-admin
```

**3. Start the backend and frontend** (in two terminals)

```powershell
npm run server
```

```powershell
npm run dev
```

Open http://localhost:5173.

- **Admin:** log in with the `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `server\.env`.
- **Contractor:** click **Register** to create an account. Use Settings → **Reset demo data** to load sample labourers.
