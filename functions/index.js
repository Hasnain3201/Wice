const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.toggleUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
        "unauthenticated",
        "Sign in as admin.",
    );
  }

  const callerDoc = await admin
      .firestore()
      .collection("users")
      .doc(context.auth.uid)
      .get();

  const callerData = callerDoc.exists ? callerDoc.data() : {};
  const callerRole = callerData.accountType ||
    callerData.role ||
    (callerData.profile ? callerData.profile.accountType : null) ||
    (callerData.profile ? callerData.profile.role : null);

  if (!callerDoc.exists || callerRole !== "admin") {
    throw new functions.https.HttpsError(
        "permission-denied",
        "Admin only.",
    );
  }

  const {uid, disable} = data || {};
  if (!uid) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "uid is required.",
    );
  }

  await admin.auth().updateUser(uid, {disabled: Boolean(disable)});
  return {status: disable ? "disabled" : "enabled"};
});
