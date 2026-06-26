"use client";

import type { FilterStats, ItineraryItem, PlanResult } from "@/lib/types";

interface PlanResultsPanelProps {
  result: PlanResult;
  eventTitle?: string;
  onClose: () => void;
}

export default function PlanResultsPanel({
  result,
  eventTitle,
  onClose,
}: PlanResultsPanelProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 max-h-[55vh] overflow-hidden rounded-t-3xl border border-[#e8eaed] bg-white shadow-2xl md:inset-x-auto md:right-6 md:bottom-6 md:max-h-[70vh] md:w-[420px] md:rounded-3xl">
      <div className="flex items-start justify-between border-b border-[#e8eaed] px-5 py-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[#1a73e8]">
            Your weekend plan
          </p>
          {eventTitle && (
            <p className="mt-1 text-sm text-[#5f6368]">Inspired by: {eventTitle}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#5f6368] hover:bg-[#f1f3f4]"
          aria-label="Close plan"
        >
          ✕
        </button>
      </div>

      <div className="overflow-y-auto px-5 py-4">
        {result.filter_stats && (
          <FilterStatsBanner stats={result.filter_stats} />
        )}

        <div className="mt-4 space-y-3">
          {result.itinerary.map((item: ItineraryItem, index) => (
            <div
              key={`${item.venue}-${index}`}
              className="rounded-xl border border-[#e8eaed] bg-[#f8f9fa] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-[#1a73e8]">{item.time}</p>
                  <p className="mt-1 font-medium text-[#202124]">{item.venue}</p>
                  <p className="text-sm text-[#5f6368]">{item.activity}</p>
                </div>
                <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[#137333]">
                  {item.cost}
                </span>
              </div>
              {item.diet_access && item.diet_access !== "—" && (
                <p className="mt-2 text-xs text-[#80868b]">{item.diet_access}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-xl bg-[#e6f4ea] px-4 py-3 text-sm text-[#137333]">
          Saved to{" "}
          <code className="font-mono text-xs">{result.cited_path}</code>
          {result.trace_id && (
            <p className="mt-1 text-xs opacity-80">Trace: {result.trace_id}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterStatsBanner({ stats }: { stats: FilterStats }) {
  return (
    <div className="rounded-xl border border-[#d2e3fc] bg-[#e8f0fe] px-4 py-3 text-sm text-[#174ea6]">
      <p className="font-medium">Prometheux Vadalog gate</p>
      <p className="mt-1 text-xs opacity-90">
        {stats.candidates_in} candidates in → {stats.candidates_out} verified out
        via <code className="font-mono">{stats.filter_method}</code> (
        {stats.concept_name})
      </p>
    </div>
  );
}
