const express = require('express');
const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// ✅ Check if env var is loaded
console.log('Loaded FIREBASE_SERVICE_ACCOUNT env length:', process.env.FIREBASE_SERVICE_ACCOUNT?.length || 0);

let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  console.log("✅ Parsed service account for:", serviceAccount.client_email);
} catch (err) {
  console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT:', err.message);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/users/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const usersSnapshot = await db.collection('users').get();
    const activeUsers = [];

    for (const doc of usersSnapshot.docs) {
      const expensesRef = db.collection(`users/${doc.id}/expenses/transactions`);
      const snapshot = await expensesRef.where('date', '==', date).limit(1).get();
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

// 🧪 Firebase test endpoint
app.get('/test', async (req, res) => {
  try {
    const snapshot = await db.collection('users').limit(1).get();
    res.json({ message: '✅ Firebase connected', count: snapshot.size });
  } catch (err) {
    console.error('❌ Firebase Test Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});
