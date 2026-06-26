"use client";

import { FormEvent, useState } from "react";

import { createDefaultProfile } from "@/lib/profile";
import type { UserProfile } from "@/lib/types";

interface ProfileOnboardingProps {
  onComplete: (profile: UserProfile) => void;
  initial?: Partial<UserProfile>;
}

const ACTIVITY_CHIPS = [
  "Live music",
  "Food & drink",
  "Outdoors",
  "Art & culture",
  "Nightlife",
  "Family-friendly",
  "Tech meetups",
  "Markets",
];

export default function ProfileOnboarding({
  onComplete,
  initial,
}: ProfileOnboardingProps) {
  const [homeCity, setHomeCity] = useState(initial?.homeCity ?? "");
  const [budget, setBudget] = useState(String(initial?.budget ?? 150));
  const [diet, setDiet] = useState(initial?.diet ?? "");
  const [activities, setActivities] = useState(initial?.activities ?? "");
  const [accessibility, setAccessibility] = useState(
    initial?.accessibility ?? "",
  );
  const [error, setError] = useState<string | null>(null);

  function toggleChip(chip: string) {
    const parts = activities
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.includes(chip)) {
      setActivities(parts.filter((p) => p !== chip).join(", "));
    } else {
      setActivities([...parts, chip].join(", "));
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const budgetNum = Number(budget);
    if (!homeCity.trim()) {
      setError("Home city is required.");
      return;
    }
    if (!Number.isFinite(budgetNum) || budgetNum <= 0) {
      setError("Enter a valid weekend budget.");
      return;
    }
    if (!diet.trim()) {
      setError("Diet preferences help us filter restaurants.");
      return;
    }
    if (!activities.trim()) {
      setError("Pick at least one activity interest.");
      return;
    }

    onComplete(
      createDefaultProfile({
        homeCity: homeCity.trim(),
        budget: budgetNum,
        diet: diet.trim(),
        activities: activities.trim(),
        accessibility: accessibility.trim() || undefined,
      }),
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124]/40 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="border-b border-[#e8eaed] px-8 py-6">
          <p className="text-xs font-medium uppercase tracking-widest text-[#1a73e8]">
            One-time setup
          </p>
          <h2 className="mt-2 text-2xl font-medium text-[#202124]">
            Tell us about your weekends
          </h2>
          <p className="mt-2 text-sm text-[#5f6368]">
            We&apos;ll personalize local events and build plans around your
            preferences — no big form on every visit.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-8 py-6">
          <Field label="Home city">
            <input
              className={inputClass}
              placeholder="Austin, TX"
              value={homeCity}
              onChange={(e) => setHomeCity(e.target.value)}
            />
          </Field>

          <Field label="Weekend budget (USD)">
            <input
              type="number"
              min={1}
              className={inputClass}
              placeholder="150"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </Field>

          <Field label="Diet & food preferences">
            <input
              className={inputClass}
              placeholder="Vegan, nut-free, halal…"
              value={diet}
              onChange={(e) => setDiet(e.target.value)}
            />
          </Field>

          <Field label="What are you into?">
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_CHIPS.map((chip) => {
                const active = activities
                  .split(",")
                  .map((s) => s.trim())
                  .includes(chip);
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => toggleChip(chip)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      active
                        ? "bg-[#1a73e8] text-white"
                        : "bg-[#f1f3f4] text-[#3c4043] hover:bg-[#e8eaed]"
                    }`}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>
            <input
              className={`${inputClass} mt-2`}
              placeholder="Or type custom interests…"
              value={activities}
              onChange={(e) => setActivities(e.target.value)}
            />
          </Field>

          <Field label="Accessibility (optional)">
            <input
              className={inputClass}
              placeholder="Wheelchair accessible venues…"
              value={accessibility}
              onChange={(e) => setAccessibility(e.target.value)}
            />
          </Field>

          {error && (
            <p className="rounded-xl bg-[#fce8e6] px-4 py-3 text-sm text-[#c5221f]">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-full bg-[#1a73e8] py-3.5 text-sm font-medium text-white transition hover:bg-[#1765cc]"
          >
            Start exploring
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[#3c4043]">{label}</label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-[#dadce0] bg-white px-4 py-3 text-sm text-[#202124] outline-none transition focus:border-[#1a73e8] focus:ring-2 focus:ring-[#1a73e8]/20";
