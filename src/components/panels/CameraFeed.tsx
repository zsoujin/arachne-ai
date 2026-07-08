import { useState } from "react";
import { Compass, Thermometer, Video, Layers, Circle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatDuration } from "@/lib/utils";
import { boundingBoxes } from "@/data/mockData";
import { useSimulation } from "@/state/SimulationContext";

const boxStyles: Record<string, string> = {
  survivor: "border-moss-400 text-moss-300",
  hazard: "border-rose-500 text-rose-400",
  object: "border-steel-400 text-steel-300",
};

export function CameraFeed() {
  const { elapsedSeconds, transientBlip } = useSimulation();
  const [mode, setMode] = useState<"visual" | "thermal">("visual");

  return (
    <Card className="relative flex h-full min-h-[360px] flex-col overflow-hidden p-0">
      {/* Feed surface */}
      <div className="bracket-corners relative flex-1 overflow-hidden bg-base-950">
        <div className="bc-tr" />
        <div className="bc-bl" />

        {/* Simulated sensor imagery */}
        <div
          className={cn(
            "absolute inset-0 transition-colors duration-700",
            mode === "visual"
              ? "bg-[radial-gradient(ellipse_at_30%_20%,#1a2029_0%,#0a0c0f_65%)]"
              : "bg-[radial-gradient(ellipse_at_40%_35%,#3a1a12_0%,#0d0705_70%)]"
          )}
        >
          <div
            className="absolute inset-0 opacity-[0.18]"
            style={{
              backgroundImage:
                "linear-gradient(#9dbadf22 1px, transparent 1px), linear-gradient(90deg, #9dbadf22 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          {/* debris silhouette shapes for realism */}
          <svg className="absolute inset-0 h-full w-full opacity-40" preserveAspectRatio="none">
            <polygon points="0,320 140,260 260,340 0,400" fill="#12151a" />
            <polygon points="700,20 900,0 1000,90 780,120" fill="#12151a" />
          </svg>
          <div className="absolute inset-y-0 left-0 w-full animate-scan bg-gradient-to-b from-transparent via-steel-400/[0.03] to-transparent" />
        </div>

        {/* Persistent bounding boxes */}
        {boundingBoxes.map((b) => (
          <div
            key={b.id}
            className={cn(
              "absolute rounded-[3px] border animate-fade-in",
              boxStyles[b.kind]
            )}
            style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}
          >
            <span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-base-950/85 px-1.5 py-[1px] font-mono text-[10px]">
              {b.label} &middot; {b.confidence}%
            </span>
          </div>
        ))}

        {/* Transient live detection blip */}
        {transientBlip && (
          <div
            className={cn(
              "absolute rounded-[3px] border transition-opacity duration-500",
              boxStyles[transientBlip.kind],
              transientBlip.visible ? "opacity-100" : "opacity-0"
            )}
            style={{
              left: `${transientBlip.x}%`,
              top: `${transientBlip.y}%`,
              width: `${transientBlip.w}%`,
              height: `${transientBlip.h}%`,
            }}
          >
            <span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-base-950/85 px-1.5 py-[1px] font-mono text-[10px]">
              {transientBlip.label} &middot; {transientBlip.confidence}%
            </span>
          </div>
        )}

        {/* Top overlay bar */}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-md bg-base-950/70 px-2 py-1 backdrop-blur-sm">
              <Circle className="h-2 w-2 fill-rose-500 text-rose-500 animate-pulse-dot" />
              <span className="font-mono text-[11px] tracking-wide text-rose-400">REC</span>
            </div>
            <div className="rounded-md bg-base-950/70 px-2 py-1 font-mono text-[11px] text-ink-300 backdrop-blur-sm tabular-nums">
              {formatDuration(elapsedSeconds)}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setMode("visual")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[11px] backdrop-blur-sm transition-colors",
                mode === "visual" ? "bg-steel-800/80 text-steel-200" : "bg-base-950/70 text-ink-500 hover:text-ink-300"
              )}
            >
              <Video className="h-3 w-3" /> VISUAL
            </button>
            <button
              onClick={() => setMode("thermal")}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[11px] backdrop-blur-sm transition-colors",
                mode === "thermal" ? "bg-amber-500/20 text-amber-300" : "bg-base-950/70 text-ink-500 hover:text-ink-300"
              )}
            >
              <Thermometer className="h-3 w-3" /> THERMAL
            </button>
          </div>
        </div>

        {/* Bottom overlay bar */}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-3">
          <div className="flex items-center gap-2 rounded-md bg-base-950/70 px-2.5 py-1.5 backdrop-blur-sm">
            <Compass className="h-3.5 w-3.5 text-steel-400" />
            <span className="font-mono text-[11px] text-ink-200">HDG 312&deg;</span>
            <span className="h-3 w-px bg-border" />
            <Layers className="h-3.5 w-3.5 text-steel-400" />
            <span className="font-mono text-[11px] text-ink-200">DEPTH 4.2m</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-base-950/70 backdrop-blur-sm">
              1080p &middot; 24fps
            </Badge>
            <Badge variant="active" className="bg-base-950/70 backdrop-blur-sm">
              Sector B
            </Badge>
          </div>
        </div>

        {/* Heading compass, top-right corner */}
        <div className="absolute right-3 top-14 hidden h-16 w-16 items-center justify-center rounded-full border border-border bg-base-950/70 backdrop-blur-sm sm:flex">
          <div className="relative h-full w-full" style={{ transform: "rotate(312deg)" }}>
            <span className="absolute left-1/2 top-1 -translate-x-1/2 font-mono text-[9px] text-rose-400">N</span>
            <div className="absolute left-1/2 top-1/2 h-6 w-px -translate-x-1/2 -translate-y-full bg-steel-400" />
          </div>
        </div>
      </div>
    </Card>
  );
}
