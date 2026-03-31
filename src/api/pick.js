import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function listPicks(userUid) {
  const q = query(
    collection(db, "picks"),
    where("user_id", "==", userUid),
    orderBy("created_at", "desc"),
  );

  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

export async function listAllPicks() {
  const q = query(collection(db, "picks"), orderBy("updated_at", "desc"));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

export async function filterPicks(filters = {}) {
  let q = collection(db, "picks");

  if (
    filters.season_year !== undefined &&
    filters.season_type !== undefined &&
    filters.week !== undefined
  ) {
    q = query(
      q,
      where("season_year", "==", filters.season_year),
      where("season_type", "==", filters.season_type),
      where("week", "==", filters.week),
    );
  } else {
    q = query(q, orderBy("week", "asc"), orderBy("updated_at", "desc"));
  }

  const snap = await getDocs(q);
  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function createPick(data) {
  const id = `${data.game_id}_${data.user_id}`;

  const ref = await setDoc(collection(db, "picks", id), {
    user_id: data.user_id || "",
    game_id: data.game_id || "",
    season_year: Number(data.season_year || 0),
    season_type: Number(data.season_type || 0),
    week: Number(data.week || 0),
    picked_team_id: data.picked_team_id || "",
    picked_team_name: data.picked_team_name || "",
    picked_team_abbrev: data.picked_team_abbrev || "",
    is_correct: data.is_correct || false,
    game_completed: data.game_completed || false,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  return ref.id;
}

export async function updatePick(id, data) {
  await updateDoc(doc(db, "picks", id), {
    ...data,
    updated_at: Date.now(),
  });
}

export async function deletePick(id) {
  await deleteDoc(doc(db, "picks", id));
}
