"use client";

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { useCallback, useEffect, useState } from "react";

import { getFirebaseAuth, isFirebaseConfigured } from "./firebase";
import { storeGoogleAccessToken } from "./calendar";
import type { AuthUser } from "./types";

/** Read-only access to Google Calendar events (weekends / busy times). */
export const GOOGLE_CALENDAR_READONLY_SCOPE =
  "https://www.googleapis.com/auth/calendar.readonly";

const MOCK_USER_KEY = "weekend-explorer-mock-user";

const googleProvider = new GoogleAuthProvider();
googleProvider.addScope(GOOGLE_CALENDAR_READONLY_SCOPE);
googleProvider.setCustomParameters({ prompt: "select_account" });

export interface GoogleSignInResult {
  user: User;
  accessToken: string | null;
}

function mapFirebaseUser(user: User): AuthUser {
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  };
}

function readMockUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(MOCK_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function writeMockUser(user: AuthUser | null) {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(MOCK_USER_KEY);
  }
}

export async function signInWithGoogle(): Promise<GoogleSignInResult | AuthUser> {
  if (!isFirebaseConfigured()) {
    const mockUser: AuthUser = {
      uid: `mock-${Date.now()}`,
      displayName: "Demo Explorer",
      email: "demo@weekend.local",
      photoURL: null,
    };
    writeMockUser(mockUser);
    return mockUser;
  }

  const auth = getFirebaseAuth();
  const result = await signInWithPopup(auth, googleProvider);
  const credential = GoogleAuthProvider.credentialFromResult(result);

  return {
    user: result.user,
    accessToken: credential?.accessToken ?? null,
  };
}

export async function signOutUser(): Promise<void> {
  if (isFirebaseConfigured()) {
    await signOut(getFirebaseAuth());
  }
  storeGoogleAccessToken(null);
  writeMockUser(null);
}

export function subscribeToAuthState(
  callback: (user: User | null) => void,
): () => void {
  if (!isFirebaseConfigured()) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(getFirebaseAuth(), callback);
}

export function getCurrentUser(): User | null {
  if (!isFirebaseConfigured()) return null;
  return getFirebaseAuth().currentUser;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const firebaseReady = isFirebaseConfigured();

  useEffect(() => {
    if (!firebaseReady) {
      setUser(readMockUser());
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(getFirebaseAuth(), (firebaseUser) => {
      setUser(firebaseUser ? mapFirebaseUser(firebaseUser) : null);
      setLoading(false);
    });

    return unsubscribe;
  }, [firebaseReady]);

  const handleSignIn = useCallback(async () => {
    const result = await signInWithGoogle();
    if ("uid" in result) {
      setUser(result);
    } else {
      storeGoogleAccessToken(result.accessToken);
      setUser(mapFirebaseUser(result.user));
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOutUser();
    setUser(null);
  }, []);

  return {
    user,
    loading,
    signInWithGoogle: handleSignIn,
    signOut: handleSignOut,
    isMockAuth: !firebaseReady,
  };
}
