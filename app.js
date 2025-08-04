const express = require('express');
const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// ✅ Load service account from environment variable
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} catch (err) {
  console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT:', err.message);
  process.exit(1); // Exit if credentials not found
}

// ✅ Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// ✅ Serve static frontend from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// ✅ API endpoint to get users with expenses on a specific date
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
    console.error('🔥 Firestore Query Error:', err.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ✅ Start the server
app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});
