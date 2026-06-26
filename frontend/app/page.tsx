"use client";

import { FormEvent, useState } from "react";

import { planWeekend } from "@/lib/mppx-client";
import type {
  FilterStats,
  ItineraryItem,
  PlannerStatus,
  PlanResult,
} from "@/lib/types";

const initialForm = {
  location: "",
  budget: "",
  diet: "",
  activities: "",
  accessibility: "",
};

export default function Home() {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState<PlannerStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PlanResult | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);

    const budget = Number(form.budget);
    if (!form.location.trim() || !form.diet.trim() || !form.activities.trim()) {
      setStatus("error");
      setError("Location, diet, and activities are required.");
      return;
    }
    if (!Number.isFinite(budget) || budget <= 0) {
      setStatus("error");
      setError("Enter a valid budget greater than zero.");
      return;
    }

    try {
      const plan = await planWeekend(
        {
          location: form.location.trim(),
          budget,
          diet: form.diet.trim(),
          activities: form.activities.trim(),
          accessibility: form.accessibility.trim() || undefined,
        },
        (next) => setStatus(next),
      );
      setResult(plan);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Planning failed.");
    }
  }

  const isLoading = status === "planning";

  return (
    <div className="min-h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-12">
        <header className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
            Multiagents Hackathon
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            The Perfect Weekend Planner
          </h1>
          <p className="max-w-2xl text-base leading-7 text-slate-300">
            Enter your location, budget, and strict constraints. The agent
            searches the live web with Tavily, filters candidates
            deterministically with{" "}
            <strong className="font-medium text-emerald-300">Prometheux / Vadalog</strong>
            , then formats a verified itinerary to{" "}
            <code className="rounded bg-slate-800 px-1.5 py-0.5 text-sm">
              cited.md
            </code>
            . No wallet required for the demo.
          </p>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl shadow-black/20 backdrop-blur"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">
                Location
              </label>
              <input
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none ring-emerald-500/40 transition focus:ring-2"
                placeholder="Austin, TX"
                value={form.location}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, location: e.target.value }))
                }
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">
                Budget (USD)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none ring-emerald-500/40 transition focus:ring-2"
                placeholder="150"
                value={form.budget}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, budget: e.target.value }))
                }
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">
                Diet constraints
              </label>
              <textarea
                rows={3}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none ring-emerald-500/40 transition focus:ring-2"
                placeholder="Vegan, nut-free, halal..."
                value={form.diet}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, diet: e.target.value }))
                }
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">
                Activity constraints
              </label>
              <textarea
                rows={3}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none ring-emerald-500/40 transition focus:ring-2"
                placeholder="Outdoor music, museums, kid-friendly..."
                value={form.activities}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, activities: e.target.value }))
                }
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-200">
                Accessibility (optional)
              </label>
              <textarea
                rows={2}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none ring-emerald-500/40 transition focus:ring-2"
                placeholder="Wheelchair accessible venues only..."
                value={form.accessibility}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    accessibility: e.target.value,
                  }))
                }
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "planning" ? "Planning your weekend..." : "Plan my weekend"}
            </button>

            {isLoading && (
              <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-sm text-slate-300">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
                Searching Tavily → Prometheux Vadalog filter → Gemini format →
                Langfuse trace...
              </div>
            )}

            {status === "error" && error && (
              <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            )}
          </form>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="text-lg font-semibold text-white">Itinerary preview</h2>
            <p className="mt-2 text-sm text-slate-400">
              Verified rows only — no hallucinated venues.
            </p>

            {!result && !isLoading && (
              <div className="mt-8 rounded-xl border border-dashed border-slate-700 px-4 py-10 text-center text-sm text-slate-500">
                Submit the form to generate your weekend plan.
              </div>
            )}

            {result && (
              <div className="mt-6 space-y-4">
                {result.filter_stats && (
                  <FilterStatsBanner stats={result.filter_stats} />
                )}
                <div className="overflow-x-auto rounded-xl border border-slate-800">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-950 text-slate-400">
                      <tr>
                        <th className="px-3 py-2">Time</th>
                        <th className="px-3 py-2">Activity</th>
                        <th className="px-3 py-2">Venue</th>
                        <th className="px-3 py-2">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.itinerary.map((item: ItineraryItem, index) => (
                        <tr
                          key={`${item.venue}-${index}`}
                          className="border-t border-slate-800"
                        >
                          <td className="px-3 py-2 whitespace-nowrap">
                            {item.time}
                          </td>
                          <td className="px-3 py-2">{item.activity}</td>
                          <td className="px-3 py-2">{item.venue}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {item.cost}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                  Saved to{" "}
                  <code className="font-mono text-emerald-50">
                    {result.cited_path}
                  </code>
                  {result.trace_id && (
                    <p className="mt-1 text-xs text-emerald-200/80">
                      Langfuse trace: {result.trace_id}
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function FilterStatsBanner({ stats }: { stats: FilterStats }) {
  return (
    <div className="rounded-xl border border-violet-500/25 bg-violet-500/10 px-4 py-3 text-sm text-violet-100">
      <p className="font-medium text-violet-50">Prometheux Vadalog gate</p>
      <p className="mt-1 text-xs text-violet-200/90">
        {stats.candidates_in} candidates in → {stats.candidates_out} verified out
        via <code className="font-mono">{stats.filter_method}</code> (
        {stats.concept_name})
      </p>
    </div>
  );
}
