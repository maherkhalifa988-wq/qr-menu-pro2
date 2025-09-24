import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

if (!admin.apps.length) admin.initializeApp();

export const loginWithPasscode = functions.https.onCall(async (data, context) => {
  const pass = String(data?.passcode || "");
  let role = null;

  if (pass === "1234") role = "admin";
  if (pass === "4321") role = "editor";

  if (!role) {
    throw new functions.https.HttpsError("permission-denied", "Invalid passcode");
  }

  const uid = role === "admin" ? "passcode-admin" : "passcode-editor";

  try {
    await admin.auth().getUser(uid);
  } catch {
    await admin.auth().createUser({ uid });
  }

  await admin.auth().setCustomUserClaims(uid, { role });
  const token = await admin.auth().createCustomToken(uid, { role });

  return { token, role };
});
