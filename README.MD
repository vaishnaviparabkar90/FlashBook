# 🎟️ BookingApp

A simple full-stack ticket booking app built using **Node.js**, **React**, **PostgreSQL**, **Redis**, and **Razorpay**.

> ⚠️ This app is built for **development and learning purposes only**. Not intended for production use.

---

## 🚀 Features

- Browse and select seats for an event.
- Seat locking via Redis for 5 minutes to prevent double booking.
- Secure payment integration with Razorpay.
- Automatic booking confirmation after payment.
- Database tracking via `booking` and `payment` tables.
- Clean and minimal frontend UI.

---

## 📸 Screenshots

(./screenshots/1.png)
(./screenshots/2.png)
(./screenshots/3.png)
(./screenshots/4.png)
(./screenshots/5.png)
## 🧠 Tech Stack

### Backend
- **Express.js**
- **PostgreSQL**
- **Redis**
- **Razorpay**

### Frontend
- **React**
- **React Router**
- **Bootstrap 5**

---

## 🧩 Database Schema

### `seats`
| Column         | Type     |
|----------------|----------|
| id             | UUID     |
| event_id       | UUID     |
| seat_number    | TEXT     |
| position_row   | INTEGER  |
| position_col   | INTEGER  |
| price          | NUMERIC  |
| status         | TEXT     |

### `booking`
| Column       | Type     |
|--------------|----------|
| id           | UUID     |
| user_id      | TEXT     |
| event_id     | UUID     |
| seat_id      | UUID     |
| name         | TEXT     |
| email        | TEXT     |
| phone        | TEXT     |
| booking_time | TIMESTAMP|

### `payment`
| Column             | Type     |
|--------------------|----------|
| id                 | UUID     |
| booking_id         | UUID     |
| razorpay_payment_id| TEXT     |
| razorpay_order_id  | TEXT     |
| amount             | NUMERIC  |
| paid_at            | TIMESTAMP|

---

(./screenshots/db.png)
## ⚙️ Setup & Run

### Backend

## Main Server
```bash
cd server
npm install
npm run dev
nodemon server.js
```
## Worker Node
```bash 
cd server/workers
nodemon seatLocker.js
```
##Frontend

```bash
cd frontend
npm install
npm run dev
```
### ✨ Author
Vaishnavi Parabkar
Made with ❤️ for development and learning

