/**
 * One-time script to set admin custom claim on a Firebase Auth user.
 * 
 * Prerequisites:
 *   1. Create a user in Firebase Console > Authentication > Users
 *   2. Download your service account key from Firebase Console > Project Settings > Service Accounts
 *   3. Save it as scripts/serviceAccountKey.json
 * 
 * Usage:
 *   node scripts/setAdminClaim.cjs <user-email>
 * 
 * Example:
 *   node scripts/setAdminClaim.cjs admin@example.com
 */

const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} catch (err) {
  console.error('Error: Could not find serviceAccountKey.json in scripts/ folder.');
  console.error('Download it from Firebase Console > Project Settings > Service Accounts.');
  process.exit(1);
}

const email = process.argv[2];

if (!email) {
  console.error('Usage: node scripts/setAdminClaim.cjs <user-email>');
  process.exit(1);
}

async function setAdmin() {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`✅ Admin claim set for user: ${email} (uid: ${user.uid})`);
    console.log('The user needs to sign out and sign back in for the claim to take effect.');
  } catch (err) {
    console.error('Error setting admin claim:', err.message);
    process.exit(1);
  }
}

setAdmin();
