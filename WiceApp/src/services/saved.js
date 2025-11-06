import {
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION = "savedCollections";

const BASE_SECTIONS = Object.freeze({
  savedSearches: [],
  consultantCollections: [],
  savedOpportunities: [],
  savedGrants: [],
  clientFilters: [],
});

export const SAVED_SECTION_KEYS = Object.freeze(Object.keys(BASE_SECTIONS));

export function createEmptySavedSections() {
  return Object.keys(BASE_SECTIONS).reduce((accumulator, key) => {
    accumulator[key] = [];
    return accumulator;
  }, {});
}

const generateId = () => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2, 10)}-${Date.now()
    .toString(36)
    .slice(2)}`;
};

const savedDocRef = (uid) => doc(db, COLLECTION, uid);

const normalizeItem = (item = {}) => ({
  id: item.id || generateId(),
  title: item.title || "Untitled",
  description: item.description || "",
  link: item.link || "",
  metadata: item.metadata || null,
});

const normalizeFolder = (folder = {}) => ({
  id: folder.id || generateId(),
  name: (folder.name || "Untitled").trim(),
  items: Array.isArray(folder.items)
    ? folder.items.map(normalizeItem)
    : [],
});

const normalizeSections = (sections = {}) => {
  const base = createEmptySavedSections();
  return Object.keys(base).reduce((accumulator, key) => {
    const section = sections[key];
    accumulator[key] = Array.isArray(section)
      ? section.map(normalizeFolder)
      : [];
    return accumulator;
  }, base);
};

const normalizeSavedDoc = (data) => ({
  role: data?.role || null,
  sections: normalizeSections(data?.sections || {}),
});

export async function ensureSavedCollectionsDoc(uid, role = null) {
  if (!uid) {
    throw new Error("Missing uid for saved collections document.");
  }

  const ref = savedDocRef(uid);
  const snapshot = await getDoc(ref);

  if (!snapshot.exists()) {
    const sections = createEmptySavedSections();
    await setDoc(ref, {
      role: role || null,
      sections,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return { role: role || null, sections };
  }

  if (role && snapshot.data()?.role !== role) {
    await setDoc(ref, { role }, { merge: true });
  }

  return normalizeSavedDoc(snapshot.data());
}

export async function fetchSavedCollections(uid) {
  if (!uid) {
    return { role: null, sections: createEmptySavedSections() };
  }

  const snapshot = await getDoc(savedDocRef(uid));
  if (!snapshot.exists()) {
    return { role: null, sections: createEmptySavedSections() };
  }
  return normalizeSavedDoc(snapshot.data());
}

export function subscribeToSavedCollections(uid, callback, onError) {
  if (!uid) {
    callback({ role: null, sections: createEmptySavedSections() });
    return () => {};
  }
  const ref = savedDocRef(uid);
  return onSnapshot(
    ref,
    (snapshot) => {
      if (!snapshot.exists()) {
        callback({ role: null, sections: createEmptySavedSections() });
        return;
      }
      callback(normalizeSavedDoc(snapshot.data()));
    },
    onError
  );
}

const assertValidSection = (section) => {
  if (!Object.prototype.hasOwnProperty.call(BASE_SECTIONS, section)) {
    throw new Error(`Unsupported saved section: ${section}`);
  }
};

export async function createSavedFolder(uid, section, name) {
  if (!uid) throw new Error("Missing uid for folder creation.");
  assertValidSection(section);
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Folder name cannot be empty.");

  const ref = savedDocRef(uid);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    const current = snapshot.exists()
      ? normalizeSections(snapshot.data().sections || {})
      : createEmptySavedSections();

    const list = current[section] || [];
    const exists = list.some(
      (folder) => folder.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      throw new Error("A folder with that name already exists.");
    }

    const newFolder = {
      id: generateId(),
      name: trimmed,
      items: [],
    };

    const updatedSections = {
      ...current,
      [section]: [...list, newFolder],
    };

    const payload = {
      sections: updatedSections,
      updatedAt: serverTimestamp(),
    };
    if (!snapshot.exists()) {
      payload.createdAt = serverTimestamp();
    }

    transaction.set(ref, payload, { merge: true });
  });
}

export async function addItemToSavedFolder(uid, section, folderId, item) {
  if (!uid) throw new Error("Missing uid for saved item.");
  assertValidSection(section);
  if (!folderId) throw new Error("Missing folder id.");

  const ref = savedDocRef(uid);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) {
      throw new Error("Saved collections are not initialized yet.");
    }

    const current = normalizeSections(snapshot.data().sections || {});
    const list = current[section] || [];
    const index = list.findIndex((folder) => folder.id === folderId);
    if (index === -1) {
      throw new Error("Folder not found.");
    }

    const folder = list[index];
    const items = Array.isArray(folder.items) ? [...folder.items] : [];
    const link = item.link || "";

    const duplicate = link
      ? items.some((entry) => entry.link === link)
      : false;
    if (duplicate) {
      throw new Error("This item is already saved in the selected folder.");
    }

    items.push(
      normalizeItem({
        ...item,
        id: generateId(),
      })
    );

    const updatedFolder = { ...folder, items };
    const updatedList = [
      ...list.slice(0, index),
      updatedFolder,
      ...list.slice(index + 1),
    ];

    const updatedSections = {
      ...current,
      [section]: updatedList,
    };

    transaction.set(
      ref,
      {
        sections: updatedSections,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });
}

export async function removeItemFromSavedFolder(uid, section, folderId, itemId) {
  if (!uid) throw new Error("Missing uid for removing saved item.");
  assertValidSection(section);
  if (!folderId || !itemId) return;

  const ref = savedDocRef(uid);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists()) return;

    const current = normalizeSections(snapshot.data().sections || {});
    const list = current[section] || [];
    const index = list.findIndex((folder) => folder.id === folderId);
    if (index === -1) return;

    const folder = list[index];
    const filteredItems = (folder.items || []).filter(
      (entry) => entry.id !== itemId
    );
    if (filteredItems.length === (folder.items || []).length) {
      return;
    }

    const updatedFolder = { ...folder, items: filteredItems };
    const updatedList = [
      ...list.slice(0, index),
      updatedFolder,
      ...list.slice(index + 1),
    ];

    const updatedSections = {
      ...current,
      [section]: updatedList,
    };

    transaction.set(
      ref,
      {
        sections: updatedSections,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  });
}

export async function listSavedFolders(uid, section) {
  if (!uid) return [];
  assertValidSection(section);
  const saved = await fetchSavedCollections(uid);
  return saved.sections[section] || [];
}
