import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  orderBy,
  query,
  updateDoc,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function listUsers() {
  const q = query(collection(db, "users"), orderBy("created_at", "desc"));

  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

export async function filterUsers(filters = {}) {
  let q = collection(db, "users");

  if (filters.status !== undefined) {
    q = query(q, where("status", "==", filters.status));
  } else {
    q = query(q, orderBy("name", "asc"));
  }

  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function createUser(data) {
  const ref = await addDoc(collection(db, "users"), {
    user_id: data.user_id || "",
    user_email: data.user_email || "",
    username: data.username || "",
    avatar_url: data.avatar_url || "",
    role: data.role || "player",
    name: data.name || "",
    nickname: data.nickname || "",
    initials: data.initials || "",
    color: data.color || "",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  return ref.id;
}

export async function updateUser(id, data) {
  await updateDoc(doc(db, "users", id), {
    ...data,
    updated_at: serverTimestamp(),
  });
}

export async function deleteUser(id) {
  await deleteDoc(doc(db, "users", id));
}

export async function syncUser(user) {
  if (!user) return;

  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      user_id: user.uid,
      user_email: user.email || "",
      username: user.displayName || "",
      avatar_url: user.photoURL || "",
      provider: user.providerData?.[0]?.providerId || "unknown",
      role: "player",
      name: user.displayName || "",
      nickname: "",
      initials: "",
      color: "",
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  } else {
    await setDoc(
      ref,
      {
        user_email: user.email || "",
        username: user.displayName || "",
        avatar_url: user.photoURL || "",
        updated_at: serverTimestamp(),
      },
      { merge: true },
    );
  }
}
