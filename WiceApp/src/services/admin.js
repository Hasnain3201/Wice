import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

const usersCollection = collection(db, "users");
const adminActionsCollection = collection(db, "adminActions");
const savedCollectionsRef = collection(db, "savedCollections");
const chatsCollection = collection(db, "chats");

export function subscribeToAllUsers(callback, onError) {
  const q = query(usersCollection, orderBy("fullName"));
  return onSnapshot(
    q,
    (snapshot) => {
      const entries = snapshot.docs.map((docSnapshot) => ({
        uid: docSnapshot.id,
        ...docSnapshot.data(),
      }));
      callback(entries);
    },
    onError
  );
}

export async function setUserAccountStatus(uid, status, metadata = {}) {
  if (!uid) throw new Error("Missing uid for status update");
  const ref = doc(db, "users", uid);
  const payload =
    status === "revoked"
      ? {
          status: "revoked",
          revokedAt: serverTimestamp(),
          revokedBy: metadata.revokedBy || null,
          revokedReason: metadata.reason || "",
        }
      : {
          status: null,
          revokedAt: null,
          revokedBy: null,
          revokedReason: "",
        };
  await updateDoc(ref, payload);
}

export async function updateUserRole(uid, nextRole) {
  if (!uid) throw new Error("Missing uid for role update");
  if (!nextRole) throw new Error("Role is required");
  const ref = doc(db, "users", uid);
  await updateDoc(ref, {
    accountType: nextRole,
    role: nextRole,
    updatedAt: serverTimestamp(),
  });
}

export async function logAdminAction(payload) {
  await addDoc(adminActionsCollection, {
    ...payload,
    createdAt: serverTimestamp(),
  });
}

export function subscribeToAdminActions(limitCount, callback, onError) {
  const q = query(
    adminActionsCollection,
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );
  return onSnapshot(
    q,
    (snapshot) => {
      callback(
        snapshot.docs.map((docSnapshot) => ({
          id: docSnapshot.id,
          ...docSnapshot.data(),
        }))
      );
    },
    onError
  );
}

export async function fetchSavedAnalytics() {
  const snapshot = await getDocs(savedCollectionsRef);
  let consultantSaves = 0;
  let grantSaves = 0;
  let clientsWithSaves = new Set();

  snapshot.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    const consultantFolders = data.sections?.consultantCollections || [];
    consultantFolders.forEach((folder) => {
      (folder.items || []).forEach(() => {
        consultantSaves += 1;
      });
    });
    if (consultantFolders.some((folder) => (folder.items || []).length > 0)) {
      clientsWithSaves.add(docSnapshot.id);
    }

    const grantFolders = data.sections?.savedGrants || [];
    grantFolders.forEach((folder) => {
      (folder.items || []).forEach(() => {
        grantSaves += 1;
      });
    });
  });

  return {
    consultantSaves,
    clientsWithSaves: clientsWithSaves.size,
    grantSaves,
    totalDocs: snapshot.size,
  };
}

export async function fetchChatAnalytics() {
  const snapshot = await getDocs(chatsCollection);
  let directChats = 0;
  let projectChats = 0;
  let staleChats = 0;
  const now = Date.now();

  snapshot.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    if (data.type === "project") {
      projectChats += 1;
    } else {
      directChats += 1;
    }
    const updatedAt =
      data.updatedAt?.toMillis?.() || data.updatedAt?.seconds * 1000 || 0;
    if (updatedAt && now - updatedAt > 1000 * 60 * 60 * 24 * 7) {
      staleChats += 1;
    }
  });

  return {
    totalChats: snapshot.size,
    directChats,
    projectChats,
    staleChats,
  };
}
