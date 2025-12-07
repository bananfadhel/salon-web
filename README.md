# 💇‍♀️ Salon Web – Full Stack Booking System

A full stack **Salon Booking Management System** built with a **Node.js + Express backend** and a **simple responsive HTML/CSS/JS frontend**.

The system supports both **Customer Booking** and **Admin Dashboard** for managing all salon operations, including employee bookings, customer bookings, and cancellation/modification control.

---

## 📌 Features

### 👩‍💻 Client-Side (Customer)
- Browse available services.
- Create a new booking.
- Phone number is displayed automatically on confirmation.
- Cancel booking functionality.
- edit booking 
- Clean and easy-to-use UI.

### 🛠️ Admin-Side (Admin Panel)
- View all customer bookings.
- View bookings per employee.
- Edit/update bookings.
- Cancel/Delete bookings.
- Improved data flow for consistent updates.
- Centralized backend logic for admin operations.

### 🧠 Backend (Server)
- Node.js + Express server.
- RESTful API for bookings.
- Booking creation, retrieval, update, and delete (CRUD).
- Centralized validation and error handling.
- Clean folder structure.
- Automatic phone number display logic.
- Separate routes for admin and client actions.

---

## 📂 Project Structure

salon-web/
│
├── Server/ # Backend (Node.js + Express)
│ ├── src/
│ │ ├── routes/ # API routes (client + admin)
│ │ ├── lib/ # Helpers / DB / utilities
│ │ └── app.js # Main server file
│ └── package.json
│
├── frontend/ # Frontend (HTML + CSS + JS)
│ ├── index.html # Main booking page
│ ├── confirm.html # Confirmation page
│ ├── admin/ # Admin dashboard pages
│ └── assets/ # Styles / Scripts / Images
│
├── .gitignore
└── package-lock.json

yaml
نسخ الكود

---

## 🚀 Installation & Setup

### 1️⃣ Clone the repository
```bash
git clone https://github.com/bananfadhel/salon-web.git
cd salon-web
2️⃣ Install backend dependencies
bash
نسخ الكود
cd Server
npm install
3️⃣ Start the server
bash
نسخ الكود
npm start
Default server runs on:

arduino
نسخ الكود
http://localhost:5000
🧪 API Endpoints (Samples)
🌸 Customer Endpoints
Method	Endpoint	Description
POST	/bookings	Create a new booking
GET	/bookings	Get all customer bookings
DELETE	/bookings/:id	Cancel/delete booking

👑 Admin Endpoints
Method	Endpoint	Description
GET	/admin/bookings	View all bookings
GET	/admin/employees/:id/bookings	View bookings of a specific employee
PUT	/admin/bookings/:id	Edit/update a booking
DELETE	/admin/bookings/:id	Cancel/delete booking
