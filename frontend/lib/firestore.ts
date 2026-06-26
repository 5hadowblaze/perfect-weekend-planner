import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  type Timestamp,
} from "firebase/firestore";
import { getFirebaseDb } from "./firebase";

export interface UserProfile {
  uid: string;
  homeCity: string;
  budget: number;
  diet: string;
  activities: string;
  accessibility?: string;
  onboardingCompleted: boolean;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export type UserProfileInput = Omit<
  UserProfile,
  "uid" | "onboardingCompleted" | "createdAt" | "updatedAt"
>;

function userDocRef(uid: string) {
  return doc(getFirebaseDb(), "users", uid);
}

export async function loadUserProfile(uid: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(userDocRef(uid));
  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as UserProfile;
}

export async function saveUserProfile(
  uid: string,
  input: UserProfileInput,
  options?: { onboardingCompleted?: boolean },
): Promise<void> {
  const existing = await loadUserProfile(uid);
  const onboardingCompleted =
    options?.onboardingCompleted ?? existing?.onboardingCompleted ?? true;

  const payload: Record<string, unknown> = {
    uid,
    homeCity: input.homeCity.trim(),
    budget: input.budget,
    diet: input.diet.trim(),
    activities: input.activities.trim(),
    onboardingCompleted,
    updatedAt: serverTimestamp(),
  };

  if (input.accessibility?.trim()) {
    payload.accessibility = input.accessibility.trim();
  }

  if (!existing) {
    payload.createdAt = serverTimestamp();
  }

  await setDoc(userDocRef(uid), payload, { merge: true });
}

export async function hasCompletedOnboarding(uid: string): Promise<boolean> {
  const profile = await loadUserProfile(uid);
  return profile?.onboardingCompleted === true;
}
