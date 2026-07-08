import { useState } from "react";
import { Compass, Thermometer, Video, Layers, Circle, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatDuration } from "@/lib/utils";
import { useSimulation } from "@/state/SimulationContext";
import type { DetectionStage } from "@/types";

const ambientBoxes = [
  { id: "bb-2", x: 30, y: 55, w: 18, h: 14, label: "Unstable concrete", confidence: 88 },
  { id: "bb-3", x: 76, y: 48, w: 10, h: 10, label: "Debris cluster", confidence: 74 },
];

const detectionStyle: Record<DetectionStage, string> = {
  thermal: "border-amber-500/70 text-amber-300 border-dashed",
  possible: "border-amber-400 text-amber-300",
  crosscheck: "border-steel-400 text-steel-300",
  confirmed: "border-moss-400 text-moss-300",
};

const detectionLabel: Record<DetectionStage, string> = {
  thermal: "Thermal anomaly",
  possible: "Possible survivor",
  crosscheck: "Cross-checking",
  confirmed: "Human detected",
};

export function CameraFeed() {
  const { elapsedSeconds, cameraStage, cameraBootLines, primaryDetection } =
    useSimulation();
  const [mode, setMode] = useState<"visual" | "thermal">("visual");

  const bootIndex =
    cameraStage === "connecting-1" ? 0 : cameraStage === "connecting-2" ? 1 : cameraStage === "connecting-3" ? 2 : 3;
  const showBoot = cameraStage !== "idle" && cameraStage !== "online";
  const showFeed = cameraStage === "online";

  return (
    <Card className="relative flex h-full min-h-[360px] flex-col overflow-hidden p-0">
      <div className="bracket-corners relative flex-1 overflow-hidden bg-base-950">
        <div className="bc-tr" />
        <div className="bc-bl" />

        {/* Standby placeholder */}
        {cameraStage === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-base-950">
            <div
              className="absolute inset-0 opacity-[0.12]"
              style={{
                backgroundImage:
                  "linear-gradient(#9dbadf22 1px, transparent 1px), linear-gradient(90deg, #9dbadf22 1px, transparent 1px)",
                backgroundSize: "40px 40px",
              }}
            />
            <Video className="h-6 w-6 text-ink-600" />
            <p className="font-mono text-[12px] tracking-[0.15em] text-ink-500">
              STANDBY &middot; AWAITING MISSION COMMAND
            </p>
            <p className="font-mono text-[10.5px] text-ink-600">
              Press Execute Mission to establish camera link
            </p>
          </div>
        )}

        {/* Connecting boot sequence */}
        {showBoot && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 bg-base-950 animate-fade-in">
            {cameraBootLines.slice(0, bootIndex + 1).map((line, i) => {
              const isCurrent = i === bootIndex;
              return (
                <p
                  key={line}
                  className={cn(
                    "font-mono text-[12.5px] tracking-wide transition-colors duration-300",
                    isCurrent ? "text-steel-300" : "text-ink-600"
                  )}
                >
                  {line}
                  {isCurrent && (
                    <span className="ml-1 inline-block h-3 w-[2px] translate-y-[1px] animate-pulse-dot bg-steel-300 align-middle" />
                  )}
                </p>
              );
            })}
          </div>
        )}

        {/* Live feed */}
        {showFeed && (
          <>
            <div
              className={cn(
                "absolute inset-0 transition-colors duration-700 animate-fade-in",
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
              <svg className="absolute inset-0 h-full w-full opacity-40" preserveAspectRatio="none">
                <polygon points="0,320 140,260 260,340 0,400" fill="#12151a" />
                <polygon points="700,20 900,0 1000,90 780,120" fill="#12151a" />
              </svg>
              <div className="absolute inset-y-0 left-0 w-full animate-scan bg-gradient-to-b from-transparent via-steel-400/[0.03] to-transparent" />
            </div>

            {/* ambient persistent detections */}
            {ambientBoxes.map((b) => (
              <div
                key={b.id}
                className="absolute rounded-[3px] border border-steel-400 text-steel-300 animate-fade-in"
                style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%` }}
              >
                <span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-base-950/85 px-1.5 py-[1px] font-mono text-[10px]">
                  {b.label} &middot; {b.confidence}%
                </span>
              </div>
            ))}

            {/* live evolving primary detection */}
            {primaryDetection && (
              <div
                key={primaryDetection.stage}
                className={cn(
                  "absolute rounded-[3px] border-[1.5px] transition-all duration-700",
                  detectionStyle[primaryDetection.stage],
                  primaryDetection.stage === "confirmed"
                    ? "bracket-corners animate-lock-pulse"
                    : "animate-fade-in"
                )}
                style={{ left: "58%", top: "22%", width: "14%", height: "26%" }}
              >
                {primaryDetection.stage === "confirmed" && (
                  <>
                    <div className="bc-tr" />
                    <div className="bc-bl" />
                  </>
                )}
                <span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-base-950/85 px-1.5 py-[1px] font-mono text-[10px]">
                  {detectionLabel[primaryDetection.stage]} &middot; {primaryDetection.confidence}%
                </span>
              </div>
            )}
          </>
        )}

        {/* Top overlay bar */}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-md bg-base-950/70 px-2 py-1 backdrop-blur-sm">
              <Circle
                className={cn(
                  "h-2 w-2",
                  showFeed ? "fill-rose-500 text-rose-500 animate-pulse-dot" : "fill-ink-600 text-ink-600"
                )}
              />
              <span className={cn("font-mono text-[11px] tracking-wide", showFeed ? "text-rose-400" : "text-ink-600")}>
                REC
              </span>
            </div>
            <div className="rounded-md bg-base-950/70 px-2 py-1 font-mono text-[11px] text-ink-300 backdrop-blur-sm tabular-nums">
              {formatDuration(elapsedSeconds)}
            </div>
          </div>

          {showFeed && (
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
          )}
        </div>

        {/* Bottom overlay bar */}
        {showFeed && (
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-3">
            <div className="flex items-center gap-2 rounded-md bg-base-950/70 px-2.5 py-1.5 backdrop-blur-sm">
              <Compass className="h-3.5 w-3.5 text-steel-400" />
              <span className="font-mono text-[11px] text-ink-200">HDG 312&deg;</span>
              <span className="h-3 w-px bg-border" />
              <Layers className="h-3.5 w-3.5 text-steel-400" />
              <span className="font-mono text-[11px] text-ink-200">DEPTH 4.2m</span>
              {primaryDetection?.stage === "confirmed" && (
                <>
                  <span className="h-3 w-px bg-border" />
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                  <span className="font-mono text-[11px] text-amber-300">Verify recommended</span>
                </>
              )}
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
        )}

        {showFeed && (
          <div className="absolute right-3 top-14 hidden h-16 w-16 items-center justify-center rounded-full border border-border bg-base-950/70 backdrop-blur-sm sm:flex">
            <div className="relative h-full w-full" style={{ transform: "rotate(312deg)" }}>
              <span className="absolute left-1/2 top-1 -translate-x-1/2 font-mono text-[9px] text-rose-400">N</span>
              <div className="absolute left-1/2 top-1/2 h-6 w-px -translate-x-1/2 -translate-y-full bg-steel-400" />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
