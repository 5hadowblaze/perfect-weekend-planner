"use client";

import Image from "next/image";

import { formatRuleBadge } from "@/lib/calendar";
import type { DiscoverEvent } from "@/lib/types";

interface EventCardProps {
  event: DiscoverEvent;
  selected: boolean;
  onClick: () => void;
}

export default function EventCard({ event, selected, onClick }: EventCardProps) {
  const rules = event.passed_rules ?? [];
  const showBadges = rules.length > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full overflow-hidden rounded-2xl border bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        selected
          ? "border-[#1a73e8] ring-2 ring-[#1a73e8]/20"
          : "border-[#e8eaed] hover:border-[#dadce0]"
      }`}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#f1f3f4]">
        <Image
          src={event.image_url}
          alt={event.title}
          fill
          className="object-cover transition duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 320px"
          unoptimized
        />
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-[#3c4043] shadow-sm">
          {event.category}
        </span>
        {event.prometheux_verified && (
          <span className="absolute left-3 top-12 rounded-full bg-[#137333]/95 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
            Prometheux ✓
          </span>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-[#1a73e8] px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
          {event.price_label}
        </span>
      </div>

      <div className="space-y-1.5 p-4">
        <h3 className="line-clamp-2 text-[15px] font-medium leading-snug text-[#202124]">
          {event.title}
        </h3>
        <p className="line-clamp-2 text-sm leading-relaxed text-[#5f6368]">
          {event.description}
        </p>

        {showBadges && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {rules.slice(0, 4).map((rule) => (
              <span
                key={rule}
                className="rounded-full bg-[#e8f0fe] px-2 py-0.5 text-[10px] font-medium text-[#1a73e8]"
              >
                {formatRuleBadge(rule)}
              </span>
            ))}
            {rules.length > 4 && (
              <span className="rounded-full bg-[#f1f3f4] px-2 py-0.5 text-[10px] text-[#5f6368]">
                +{rules.length - 4}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-1 text-xs text-[#80868b]">
          <span>{event.date_hint ?? "This weekend"}</span>
          <span className="truncate pl-2">{event.location}</span>
        </div>
      </div>
    </button>
  );
}
