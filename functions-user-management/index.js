const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();
const VALID_ROLES = ["admin", "import", "export", "viewer"];

async function requireAdmin(request) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in.");
  }

  const roleSnap = await db.collection("users").doc(request.auth.uid).get();
  const role = roleSnap.exists ? roleSnap.data().role : null;

  if (role !== "admin") {
    throw new HttpsError("permission-denied", "Only admins can manage users.");
  }

  return {
    uid: request.auth.uid,
    email: request.auth.token.email || "unknown",
  };
}

function validateEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateRole(role) {
  return VALID_ROLES.includes(role);
}

exports.createUserByAdmin = onCall({ region: "us-central1" }, async (request) => {
  const adminUser = await requireAdmin(request);
  const { email, password, role } = request.data || {};

  if (!validateEmail(email)) {
    throw new HttpsError("invalid-argument", "Invalid email.");
  }
  if (typeof password !== "string" || password.length < 6) {
    throw new HttpsError("invalid-argument", "Password must have at least 6 characters.");
  }
  if (!validateRole(role) || role === "viewer") {
    throw new HttpsError("invalid-argument", "Role must be admin, import, or export.");
  }

  const userRecord = await admin.auth().createUser({
    email,
    password,
    disabled: false,
    emailVerified: false,
  });

  await admin.auth().setCustomUserClaims(userRecord.uid, { role });

  await db.collection("users").doc(userRecord.uid).set({
    uid: userRecord.uid,
    email,
    role,
    disabled: false,
    createdBy: adminUser.email,
    createdByUid: adminUser.uid,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { uid: userRecord.uid, email, role };
});

exports.updateUserRoleByAdmin = onCall({ region: "us-central1" }, async (request) => {
  const adminUser = await requireAdmin(request);
  const { uid, role } = request.data || {};

  if (typeof uid !== "string" || !uid) {
    throw new HttpsError("invalid-argument", "Missing user UID.");
  }
  if (!validateRole(role)) {
    throw new HttpsError("invalid-argument", "Invalid role.");
  }
  if (uid === adminUser.uid) {
    throw new HttpsError("failed-precondition", "You cannot change your own role here.");
  }

  await admin.auth().setCustomUserClaims(uid, { role });
  await db.collection("users").doc(uid).set({
    role,
    updatedBy: adminUser.email,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  return { uid, role };
});

exports.disableUserByAdmin = onCall({ region: "us-central1" }, async (request) => {
  const adminUser = await requireAdmin(request);
  const { uid } = request.data || {};

  if (typeof uid !== "string" || !uid) {
    throw new HttpsError("invalid-argument", "Missing user UID.");
  }
  if (uid === adminUser.uid) {
    throw new HttpsError("failed-precondition", "You cannot disable your own account.");
  }

  await admin.auth().updateUser(uid, { disabled: true });
  await db.collection("users").doc(uid).set({
    disabled: true,
    disabledBy: adminUser.email,
    disabledAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  return { uid, disabled: true };
});
