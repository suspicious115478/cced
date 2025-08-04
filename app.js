const express = require('express');
const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Load service account key from ENV
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint (adjust as needed)
app.get('/users/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const usersSnapshot = await db.collection('users').get();

    const activeUsers = [];

    for (const doc of usersSnapshot.docs) {
      const expensesRef = db.collection(`users/${doc.id}/expenses/transactions`);
      const snapshot = await expensesRef
        .where('date', '==', date)
        .limit(1)
        .get();

      if (!snapshot.empty) {
        activeUsers.push({ uid: doc.id, name: doc.data().name });
      }
    }

    res.json(activeUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

