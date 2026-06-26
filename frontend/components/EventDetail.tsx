"use client";

import Image from "next/image";

import type { DiscoverEvent, PlannerStatus } from "@/lib/types";

interface EventDetailProps {
  event: DiscoverEvent;
  onClose: () => void;
  onPlan: () => void;
  planStatus: PlannerStatus;
  planError: string | null;
}

export default function EventDetail({
  event,
  onClose,
  onPlan,
  planStatus,
  planError,
}: EventDetailProps) {
  const isPlanning = planStatus === "planning";

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="relative aspect-[16/9] shrink-0 overflow-hidden bg-[#f1f3f4]">
        <Image
          src={event.image_url}
          alt={event.title}
          fill
          className="object-cover"
          sizes="400px"
          unoptimized
        />
        <button
          type="button"
          onClick={onClose}
          className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#5f6368] shadow-md transition hover:bg-white"
          aria-label="Close details"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#e8f0fe] px-3 py-1 text-xs font-medium text-[#1a73e8]">
            {event.category}
          </span>
          <span className="rounded-full bg-[#e6f4ea] px-3 py-1 text-xs font-semibold text-[#137333]">
            {event.price_label}
          </span>
          {event.prometheux_verified && (
            <span className="rounded-full bg-[#137333] px-3 py-1 text-xs font-semibold text-white">
              Prometheux verified
            </span>
          )}
          {event.date_hint && (
            <span className="rounded-full bg-[#f1f3f4] px-3 py-1 text-xs text-[#5f6368]">
              {event.date_hint}
            </span>
          )}
        </div>

        {(event.passed_rules?.length ?? 0) > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {event.passed_rules!.map((rule) => (
              <span
                key={rule}
                className="rounded-full bg-[#e8f0fe] px-2.5 py-1 text-[11px] font-medium text-[#1a73e8]"
              >
                {rule.replace(/_/g, " ")}
              </span>
            ))}
          </div>
        )}

        <h2 className="mt-4 text-xl font-medium leading-tight text-[#202124]">
          {event.title}
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-[#5f6368]">
          {event.description}
        </p>

        <div className="mt-4 space-y-2 rounded-xl bg-[#f8f9fa] p-4 text-sm">
          <p className="text-[#3c4043]">
            <span className="font-medium text-[#202124]">Where:</span>{" "}
            {event.location}
          </p>
          <p className="text-[#3c4043]">
            <span className="font-medium text-[#202124]">Coordinates:</span>{" "}
            {event.lat.toFixed(4)}, {event.lng.toFixed(4)}
          </p>
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[#1a73e8] hover:underline"
          >
            View source →
          </a>
        </div>

        <div className="mt-auto space-y-3 pt-6">
          {planError && (
            <p className="rounded-xl border border-[#fce8e6] bg-[#fce8e6] px-4 py-3 text-sm text-[#c5221f]">
              {planError}
            </p>
          )}

          <button
            type="button"
            onClick={onPlan}
            disabled={isPlanning}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1a73e8] px-6 py-3.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#1765cc] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPlanning ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Planning with Prometheux…
              </>
            ) : (
              "Plan this weekend"
            )}
          </button>

          <p className="text-center text-xs text-[#80868b]">
            Uses your profile constraints + this event via Tavily → Prometheux →
            Gemini
          </p>
        </div>
      </div>
    </div>
  );
}
