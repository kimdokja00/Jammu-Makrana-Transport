# Jammu Makrana Transport & Komal Minerals Supplier

[![MERN Stack](https://img.shields.io/badge/Stack-MERN-blue.svg)](https://react.dev/)
[![React 18](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF.svg)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4.19-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248.svg)](https://www.mongodb.com/atlas)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black.svg)](https://vercel.com/)

A modern, production-grade MERN web platform and logistics management system for **Jammu Makrana Transport & Komal Minerals Supplier** (trading high-grade Makrana marble, granite, and minerals across India since 1985).

Designed with a dual-portal architecture: a responsive client-facing storefront with native cargo booking and customer tracking, paired with an authenticated Fleet Admin Console for logistics, dispatch tracking, payment status management, and customer inquiry triage.

---

## 🚀 Key Features

### 1. Customer Portal & Authentication
* **Account Management**: Register with email/password or use **1-Click Google Sign-In** via Google Identity Services (GIS).
* **Consignment Tracking**: Real-time progress milestone tracking (`Placed` ➔ `Confirmed` ➔ `Dispatched` ➔ `Shipped` ➔ `In-Transit` ➔ `Delivered`).
* **Order History**: Access historical orders, stone slab counts, tonnage, destination addresses, and payment receipts.
* **Order Rejection & Cancellation Support**: Direct WhatsApp and phone escalation buttons to request order cancellation before dispatch.

### 2. Fleet Admin Console
* **Order Lifecycle Management**: View, filter (`Pending`, `Active Transit`, `Delivered`, `Rejected`), and search orders in real time.
* **Dispatch & Route Tracking**: Update dispatch origin location, dispatch dates, shipped dates, and estimated arrival schedules.
* **Payment Control**: Track payment statuses (`Pending`, `Partial`, `Paid`, `Refunded`) and record received payment values.
* **Customer Inquiries & Messages Desk**: Dedicated dashboard view for contact form submissions with 1-click **Reply via WhatsApp**, **Phone Call**, **Email**, and status updates (`New`, `Contacted`, `Closed`).

### 3. Transportation Booking Engine
* **Native Order Submission**: Calculates cargo requirements (stone variety, slab dimensions, slab count, tonnes) and saves directly to MongoDB Atlas.
* **Auto-Order Referencing**: Generates unique tracking identifiers (e.g. `JMT-XXXXXXXX-XXXX`).
* **Guest & Authenticated Flows**: Unauthenticated visitors can book consignments and easily link their orders by creating an account.

### 4. Stone & Mineral Catalog
* Dynamic catalog of Makrana marble varieties and minerals (Albeta, Dungri, White Marble, Kumari, Quartz, Feldspar, Dolomite).
* Comprehensive specifications, finishes, applications, and direct quote requests.

---

## 🏗️ Architecture & Stack Layout

```text
├── api/
│   └── index.js             # Vercel Serverless Function entry point (bridges to server/app.js)
├── server/
│   ├── app.js               # Express application configuration & dual-route mounting
│   ├── dev-server.js        # Local development listener (http://localhost:5000)
│   ├── lib/
│   │   ├── auth.js          # JWT token signing & authentication middleware
│   │   ├── db.js            # Cached serverless Mongoose connection with URI sanitizer
│   │   └── env.js           # Environment variable loader (.env.local)
│   ├── models/
│   │   ├── User.js          # User schema (roles: 'customer' | 'admin', Google OAuth, bcrypt)
│   │   ├── Order.js         # Consignment schema (status milestones, dispatch, payments)
│   │   ├── Stone.js         # Stone catalog item schema
│   │   └── Enquiry.js       # Customer contact form submissions schema
│   ├── routes/
│   │   ├── auth.js          # /api/auth (register, login, google, me)
│   │   ├── orders.js        # /api/orders (create, my-orders, admin update, reject)
│   │   ├── stones.js        # /api/stones (catalog listing & slug lookups)
│   │   └── enquiries.js     # /api/enquiries (contact submission & admin triage)
│   ├── seed.js              # Catalog seed script (npm run seed)
│   └── seed-admin.js        # Default admin seed script (npm run seed:admin)
├── client/
│   ├── index.html           # HTML entry point with Google GIS SDK
│   └── src/
│       ├── components/      # UI components (Header, Footer, GoogleAuthButton, etc.)
│       ├── context/         # AuthContext.jsx (global authentication state)
│       ├── data/            # Business identity, copy (siteContent.js), fallback stones
│       ├── pages/
│       │   ├── admin/       # AdminLogin.jsx, AdminDashboard.jsx, AdminOrderDetail.jsx
│       │   ├── customer/    # CustomerLogin.jsx, CustomerRegister.jsx, CustomerDashboard.jsx, CustomerOrderDetail.jsx
│       │   ├── Home.jsx, About.jsx, Transportation.jsx, Contact.jsx, StoneRange.jsx, StoneDetail.jsx
│       └── styles/          # globals.css (styles for portals, timelines, admin grids)
├── vercel.json              # Vercel serverless routing & SPA fallback rules
└── vite.config.js           # Vite build config with /api proxy to localhost:5000
```

---

## ⚙️ Environment Variables

Create a `.env.local` file in the root directory (or configure under **Settings ➔ Environment Variables** in Vercel):

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://<user>:<pwd>@cluster0.xxx.mongodb.net/makrana_transportation` |
| `JWT_SECRET` | Secret key for signing authentication JWT tokens | `makrana-transport-jwt-secret-key-2026` |
| `ADMIN_EMAIL` | Default administrator account email | `admin@jmtransport.com` |
| `ADMIN_PASSWORD` | Default administrator password | `Admin@1985` |
| `ADMIN_NAME` | Default administrator name | `Fleet Administrator` |
| `ADMIN_PHONE` | Administrative contact & WhatsApp number | `9919400782` |
| `VITE_GOOGLE_CLIENT_ID`| Google OAuth 2.0 Web Client ID (Frontend) | `897250587326-xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Web Client ID (Backend) | `897250587326-xxx.apps.googleusercontent.com` |
| `PORT` | Local Express development port | `5000` |

---

## 🛠️ Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy and populate `.env.local`:
```bash
cp .env.example .env.local
```

### 3. Initialize Database
Seed the stone catalog and the admin superuser into your MongoDB Atlas cluster:
```bash
npm run seed        # Seeds catalog stones
npm run seed:admin  # Seeds/updates the admin credentials
```

### 4. Start Development Servers
Runs both the Express API (:5000) and the Vite frontend (:5173) concurrently:
```bash
npm run dev
```

Visit **http://localhost:5173** in your browser.

#### Individual Scripts:
```bash
npm run dev:api     # Start Express server with auto-reload (--watch)
npm run dev:web     # Start Vite frontend only
npm run build       # Build production bundle into dist/
npm run preview     # Preview production build locally
```

---

## 🔐 Default Admin Credentials

* **URL**: `/admin/login`
* **Email**: `admin@jmtransport.com`
* **Password**: `Admin@1985`
* **Phone / WhatsApp**: `+91 99194 00782`

*(You can customize these in `.env.local` or update them in MongoDB Atlas)*

---

## 🌐 Deploying to Vercel

1. Push your repository to GitHub.
2. In **[Vercel Dashboard](https://vercel.com/dashboard)**, click **Add New ➔ Project** and import `Jammu-Makrana-Transport`.
3. Go to **Settings ➔ Environment Variables** and add:
   * `MONGODB_URI`
   * `JWT_SECRET`
   * `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_PHONE`
   * `VITE_GOOGLE_CLIENT_ID`
4. **MongoDB Atlas Network Access**: Ensure `0.0.0.0/0` is whitelisted in your Atlas project under **Network Access** (required for dynamic Vercel serverless IPs).
5. Trigger **Deploy**.
6. Verify deployment health at:
   ```text
   https://<your-project>.vercel.app/api/health
   ```
   Should return: `{"status":"ok", "database":"connected"}`

---

## 📡 API Reference

### Health
* `GET /api/health` — Checks service status and MongoDB Atlas connection state.

### Authentication (`/api/auth`)
* `POST /api/auth/register` — Register new customer account (`fullName`, `email`, `phone`, `password`).
* `POST /api/auth/login` — Sign in customer or admin (`email`, `password`).
* `POST /api/auth/google` — Authenticate via Google Identity Services ID token (`credential`).
* `GET /api/auth/me` — Retrieve current authenticated session profile (Bearer token).

### Orders (`/api/orders`)
* `POST /api/orders` — Place new transportation order. Supports guest and customer bookings.
* `GET /api/orders/my-orders` — Customer order history (Authenticated Customer).
* `GET /api/orders/:id` — Single order detail with milestone progression.
* `GET /api/orders` — All orders list with filters (`status`, `search`) (Admin only).
* `PATCH /api/orders/:id/status` — Update order status, dispatch date/location, and payment details (Admin only).

### Inquiries & Messages (`/api/enquiries`)
* `POST /api/enquiries` — Submit contact form inquiry from the website.
* `GET /api/enquiries` — Fetch all inquiries for the admin desk (Admin only).
* `PATCH /api/enquiries/:id` — Update inquiry status (`new`, `contacted`, `closed`) (Admin only).

### Stones (`/api/stones`)
* `GET /api/stones` — Fetch catalog items with category and featured filters.
* `GET /api/stones/:slug` — Fetch detailed specifications for a single stone.

---

## 📄 License & Proprietary Rights
Copyright © 1985–2026 **Jammu Makrana Transport & Komal Minerals Supplier**. All rights reserved.
Developed for internal operations and commercial client logistics.
