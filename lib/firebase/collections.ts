import { collection } from "firebase/firestore";

import { getFirebaseDb } from "./client";

export function usersCol() {
  return collection(getFirebaseDb(), "users");
}

export function transactionsCol() {
  return collection(getFirebaseDb(), "transactions");
}

export function notificationsCol() {
  return collection(getFirebaseDb(), "notifications");
}

