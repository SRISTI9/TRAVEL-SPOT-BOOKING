const express = require('express');
const http = require('http');
const path = require('path');
const mysql = require('mysql2');
const cors = require('cors');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const crypto = require('crypto');

dotenv.config();
const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MySQL DB Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: process.env.MYSQL_PASSWORD,
  database: 'travel'
});

db.connect(err => {
  if (err) {
    console.error('❌ DB connection failed:', err.message);
    return;
  }
  console.log('✅ Connected to MySQL database');
});

// Nodemailer Setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

function sendEmail(to, subject, text) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) console.error("❌ Email error:", error);
    else console.log("📧 Email sent successfully:", info.response);
  });
}

// ========= USER REGISTRATION =========
app.post('/api/register', (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
  db.query(sql, [username, email, password], (err, result) => {
    if (err) {
      console.error('❌ Registration error:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }

    console.log(`✅ Registered user: ${username}`);
    res.status(200).json({ message: 'User registered successfully' });
  });
});

// ========= LOGIN / OTP LOGIN =========
app.post('/api/login', (req, res) => {
  const { identifier, credential } = req.body;

  const sql = 'SELECT * FROM users WHERE username = ? OR email = ?';
  db.query(sql, [identifier, identifier], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(401).json({ error: 'User not found.' });

    const user = results[0];
    const now = new Date();

    if (
      user.password === credential ||
      (user.otp === credential && new Date(user.otp_expiry) > now)
    ) {
      return res.status(200).json({ message: 'Login successful' });
    }

    return res.status(401).json({ error: 'Invalid password or OTP.' });
  });
});

// ========= SEND OTP =========
app.post('/api/send-otp', (req, res) => {
  const { identifier } = req.body;

  const sql = 'SELECT * FROM users WHERE username = ? OR email = ?';
  db.query(sql, [identifier, identifier], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    if (results.length === 0) return res.status(404).json({ error: 'User not found.' });

    const user = results[0];
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const updateSql = 'UPDATE users SET otp = ?, otp_expiry = ? WHERE id = ?';
    db.query(updateSql, [otp, expiry, user.id], (updateErr) => {
      if (updateErr) return res.status(500).json({ error: 'Error storing OTP' });

      sendEmail(
        user.email,
        'Your OTP for Travel Spotlight Login',
        `Hi ${user.username},\n\nYour OTP is: ${otp}\nIt is valid for 5 minutes.\n\n- Travel Spotlight`
      );

      res.status(200).json({ message: 'OTP sent to your email' });
    });
  });
});

// ========= BOOKING =========
app.post('/api/book', (req, res) => {
  const { customer_name, spot, booking_date, tickets, contact_number, email } = req.body;

  if (!customer_name || !spot || !booking_date || !tickets || !contact_number || !email) {
    return res.status(400).json({ error: 'All booking fields are required.' });
  }

  const sql = 'INSERT INTO bookings (customer_name, spot, booking_date, tickets, contact_number, email) VALUES (?, ?, ?, ?, ?, ?)';
  db.query(sql, [customer_name, spot, booking_date, tickets, contact_number, email], (err, result) => {
    if (err) {
      console.error('❌ Booking error:', err.message);
      return res.status(500).json({ error: 'Database error' });
    }

    sendEmail(
      email,
      '🎫 Your Travel Booking Confirmation!',
      `Hi ${customer_name}, 👋
      
Thank you for choosing Travel Spotlight! 🌍✈

Here are your booking details:
🔹 Destination: ${spot}
📅 Date: ${booking_date}
🎟 Tickets: ${tickets}
📞 Contact: ${contact_number}

We hope you have an amazing experience! 💖

Safe travels, 
The Travel Spotlight Team 🚀`
    );

    res.status(200).json({ message: '✅ Booking successful!' });
  });
});

// ========= START SERVER =========
const PORT = process.env.PORT || 5500;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
