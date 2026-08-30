const fs = require('fs');
let code = fs.readFileSync('C:/Projects/LANZAR/auth/auth-backend/server.js', 'utf8');

code = code.replace(
  "const serviceAccount = require('../../firebase-credentials/lanzar-95ae3-firebase-adminsdk-fbsvc-86e8ea5817.json');\ninitializeApp({\n  credential: cert(serviceAccount)\n});",
  `let credentialConfig;
if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
  try {
    const serviceAccountParams = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    credentialConfig = cert(serviceAccountParams);
  } catch (err) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY from environment');
    process.exit(1);
  }
} else {
  try {
    const serviceAccount = require('../../firebase-credentials/lanzar-95ae3-firebase-adminsdk-fbsvc-86e8ea5817.json');
    credentialConfig = cert(serviceAccount);
  } catch (err) {
    console.warn('No local service account file found, and no FIREBASE_SERVICE_ACCOUNT_KEY provided.');
  }
}

initializeApp({
  credential: credentialConfig
});`
);

fs.writeFileSync('C:/Projects/LANZAR/auth/auth-backend/server.js', code, 'utf8');
