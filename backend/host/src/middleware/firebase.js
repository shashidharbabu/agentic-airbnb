const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load Firebase Admin SDK service account key
const serviceAccountPath = path.join(__dirname, '../../../../FirebaseAdminAccess.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id
});

module.exports = admin;

