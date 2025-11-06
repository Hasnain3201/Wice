import {
  addDoc,
  collection,
  deleteField,
  doc,
  getDocs,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

const CHATS_COLLECTION = "chats";

function normalizeParticipant(participant) {
  return {
    uid: participant.uid,
    role: participant.role || null,
    fullName: participant.fullName || participant.displayName || participant.email || "Unknown User",
    email: participant.email || null,
  };
}

export function subscribeToUserChats(uid, callback) {
  const q = query(
    collection(db, CHATS_COLLECTION),
    where("participantIds", "array-contains", uid)
  );
  return onSnapshot(q, callback);
}

export function listenToMessages(chatId, callback) {
  const messagesRef = collection(db, CHATS_COLLECTION, chatId, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"));
  return onSnapshot(q, callback);
}

async function findDirectChat(currentUid, targetUid) {
  const q = query(
    collection(db, CHATS_COLLECTION),
    where("type", "==", "direct"),
    where("participantIds", "array-contains", currentUid),
    limit(20)
  );
  const snapshot = await getDocs(q);
  const match = snapshot.docs.find((docSnapshot) => {
    const data = docSnapshot.data();
    return data.participantIds?.includes(targetUid);
  });
  return match ? { id: match.id, ...match.data() } : null;
}

export async function getOrCreateDirectChat(currentUser, targetUser) {
  const existing = await findDirectChat(currentUser.uid, targetUser.uid);
  if (existing) {
    return existing;
  }

  const participants = [
    normalizeParticipant(currentUser),
    normalizeParticipant(targetUser),
  ];

  const data = {
    type: "direct",
    participantIds: participants.map((p) => p.uid),
    participants,
    name: targetUser.fullName || targetUser.displayName || targetUser.email || "Direct Chat",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: null,
  };

  const ref = await addDoc(collection(db, CHATS_COLLECTION), data);
  return { id: ref.id, ...data };
}

export async function ensureProjectChat(chatId, fields) {
  const chatRef = doc(db, CHATS_COLLECTION, chatId);
  const snapshot = await getDoc(chatRef);

  const participants = (fields.participants || []).map(normalizeParticipant);
  const participantIds = participants
    .map((p) => p.uid)
    .filter((uid) => Boolean(uid));

  const payload = {
    type: "project",
    name: fields.name,
    participantIds,
    participants,
    updatedAt: serverTimestamp(),
  };

  if (!snapshot.exists()) {
    payload.createdAt = serverTimestamp();
    await setDoc(chatRef, payload);
  } else {
    await updateDoc(chatRef, payload);
  }
  return { id: chatId, ...(snapshot.data() || payload) };
}

export async function addMessage(chatId, message) {
  const chatRef = doc(db, CHATS_COLLECTION, chatId);
  const messagesRef = collection(chatRef, "messages");

  const messagePayload = {
    text: message.text,
    senderId: message.senderId,
    senderRole: message.senderRole || null,
    senderName: message.senderName || "Unknown",
    createdAt: serverTimestamp(),
  };

  await addDoc(messagesRef, messagePayload);
  await updateDoc(chatRef, {
    updatedAt: serverTimestamp(),
    lastMessage: {
      text: message.text,
      senderId: message.senderId,
      senderName: message.senderName || "Unknown",
      createdAt: serverTimestamp(),
    },
  });
}

export async function findUserByEmail(email) {
  if (!email) return null;
  const usersRef = collection(db, "users");
  const q = query(usersRef, where("email", "==", email), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { uid: docSnap.id, ...docSnap.data() };
}

export async function findUserByFullName(fullName, role) {
  if (!fullName) return null;
  const usersRef = collection(db, "users");
  const constraints = [where("fullName", "==", fullName)];
  if (role) constraints.push(where("accountType", "==", role));
  const q = query(usersRef, ...constraints, limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const docSnap = snapshot.docs[0];
  return { uid: docSnap.id, ...docSnap.data() };
}

export async function hideChatForUser(uid, chatId, hiddenAt) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    [`hiddenChats.${chatId}`]: hiddenAt,
  });
}

export async function unhideChatForUser(uid, chatId) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    [`hiddenChats.${chatId}`]: deleteField(),
  });
}
