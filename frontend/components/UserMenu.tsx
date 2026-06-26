"use client";

import type { AuthUser } from "@/lib/types";

interface UserMenuProps {
  user: AuthUser;
  homeCity?: string;
  isMockAuth: boolean;
  onSignOut: () => void;
  onEditProfile: () => void;
}

export default function UserMenu({
  user,
  homeCity,
  isMockAuth,
  onSignOut,
  onEditProfile,
}: UserMenuProps) {
  const initials =
    user.displayName?.charAt(0)?.toUpperCase() ??
    user.email?.charAt(0)?.toUpperCase() ??
    "?";

  return (
    <div className="flex items-center gap-3">
      {homeCity && (
        <div className="hidden items-center gap-2 rounded-full bg-[#f1f3f4] px-4 py-2 text-sm text-[#3c4043] sm:flex">
          <span className="text-[#80868b]">📍</span>
          <span className="font-medium">{homeCity}</span>
        </div>
      )}

      <div className="group relative">
        <button
          type="button"
          className="flex items-center gap-2 rounded-full border border-[#e8eaed] bg-white py-1 pl-1 pr-3 shadow-sm transition hover:shadow-md"
        >
          {user.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoURL}
              alt=""
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a73e8] text-sm font-medium text-white">
              {initials}
            </span>
          )}
          <span className="hidden text-sm font-medium text-[#3c4043] md:inline">
            {user.displayName ?? user.email ?? "Account"}
          </span>
        </button>

        <div className="invisible absolute right-0 top-full z-20 mt-2 w-56 translate-y-1 rounded-2xl border border-[#e8eaed] bg-white py-2 opacity-0 shadow-xl transition group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
          <div className="border-b border-[#e8eaed] px-4 py-3">
            <p className="truncate text-sm font-medium text-[#202124]">
              {user.displayName ?? "Signed in"}
            </p>
            <p className="truncate text-xs text-[#80868b]">{user.email}</p>
            {isMockAuth && (
              <p className="mt-1 text-xs text-[#f9ab00]">Demo auth (no Firebase)</p>
            )}
          </div>
          <button
            type="button"
            onClick={onEditProfile}
            className="block w-full px-4 py-2.5 text-left text-sm text-[#3c4043] hover:bg-[#f8f9fa]"
          >
            Edit preferences
          </button>
          <button
            type="button"
            onClick={onSignOut}
            className="block w-full px-4 py-2.5 text-left text-sm text-[#c5221f] hover:bg-[#fce8e6]"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
