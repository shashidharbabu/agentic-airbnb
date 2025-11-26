const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load Firebase Admin SDK service account key - optional
let firebaseInitialized = false;
const serviceAccountPath = path.join(__dirname, '../../../../FirebaseAdminAccess.json');

try {
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    // Initialize Firebase Admin
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id
    });
    firebaseInitialized = true;
    console.log('Firebase Admin initialized successfully');
  } else {
    console.warn('FirebaseAdminAccess.json not found. Firebase features will be disabled.');
  }
} catch (error) {
  console.warn('Firebase initialization failed:', error.message);
}

// Export admin with initialization status
admin.isInitialized = firebaseInitialized;
module.exports = admin;

