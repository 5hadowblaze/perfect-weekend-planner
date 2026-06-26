"use client";

import dynamic from "next/dynamic";

import type { DiscoverEvent } from "@/lib/types";

const ExplorerMapLeaflet = dynamic(() => import("@/components/ExplorerMapLeaflet"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#f1f3f4]">
      <div className="flex flex-col items-center gap-3 text-[#5f6368]">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#1a73e8] border-t-transparent" />
        <p className="text-sm">Loading map…</p>
      </div>
    </div>
  ),
});

interface ExplorerMapProps {
  events: DiscoverEvent[];
  center: { lat: number; lng: number };
  selectedId: string | null;
  onSelectEvent: (id: string) => void;
}

export default function ExplorerMap(props: ExplorerMapProps) {
  return <ExplorerMapLeaflet {...props} />;
}
