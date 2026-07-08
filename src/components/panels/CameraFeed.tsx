import { useEffect, useRef, useState } from "react";
import {
  Compass,
  Thermometer,
  Video,
  Layers,
  Circle,
  ShieldAlert,
  WifiOff,
  Aperture,
} from "lucide-react";
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

/**
 * Renders animated, low-res sensor grain onto a small offscreen canvas and
 * stretches it across the feed with `mix-blend-mode: overlay`. This gives the
 * scene a "real camera" grain/noise texture without recomputing full-res
 * pixel data every frame.
 */
function NoiseLayer({ intensity }: { intensity: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = 160;
    const H = 90;
    canvas.width = W;
    canvas.height = H;
    const frame = ctx.createImageData(W, H);

    let rafId: number;
    let lastTick = 0;

    const draw = (t: number) => {
      rafId = requestAnimationFrame(draw);
      if (t - lastTick < 70) return; // ~14fps grain refresh, cheap + convincing
      lastTick = t;
      const buf = frame.data;
      for (let i = 0; i < buf.length; i += 4) {
        const shade = 90 + Math.random() * 130;
        buf[i] = shade;
        buf[i + 1] = shade;
        buf[i + 2] = shade;
        buf[i + 3] = 255;
      }
      ctx.putImageData(frame, 0, 0);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-300"
      style={{
        opacity: intensity,
        mixBlendMode: "overlay",
        imageRendering: "pixelated",
      }}
    />
  );
}

export function CameraFeed() {
  const {
    elapsedSeconds,
    cameraStage,
    cameraBootLines,
    primaryDetection,
    sensorOcclusion,
    signalLevel,
    signalDbm,
  } = useSimulation();
  const [mode, setMode] = useState<"visual" | "thermal">("visual");
  const [localGlitch, setLocalGlitch] = useState(false);

  const bootIndex =
    cameraStage === "connecting-1" ? 0 : cameraStage === "connecting-2" ? 1 : cameraStage === "connecting-3" ? 2 : 3;
  const showBoot = cameraStage !== "idle" && cameraStage !== "online";
  const showFeed = cameraStage === "online";

  // Occasional signal interference, independent of any single upstream
  // system: brief static/glitch bursts every ~6-15s, on top of whatever the
  // simulation's own sensor-occlusion / weak-signal state is doing.
  useEffect(() => {
    if (!showFeed) return;
    let hideId: ReturnType<typeof setTimeout>;
    let showId: ReturnType<typeof setTimeout>;

    const scheduleNext = () => {
      const delay = 6000 + Math.random() * 9000;
      showId = setTimeout(() => {
        setLocalGlitch(true);
        hideId = setTimeout(() => {
          setLocalGlitch(false);
          scheduleNext();
        }, 160 + Math.random() * 260);
      }, delay);
    };
    scheduleNext();

    return () => {
      clearTimeout(showId);
      clearTimeout(hideId);
    };
  }, [showFeed]);

  const interference = localGlitch || sensorOcclusion || signalLevel <= 2;
  const frameCount = Math.floor(elapsedSeconds * 24);

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
                interference && "animate-glitch",
                mode === "visual"
                  ? "bg-[radial-gradient(ellipse_at_32%_22%,#232323_0%,#050505_70%)]"
                  : "bg-[radial-gradient(ellipse_at_40%_35%,#3a1a12_0%,#0d0705_70%)]"
              )}
            >
              {/* Perspective depth grid — simulated floor/corridor recession */}
              {mode === "visual" && (
                <svg
                  className="absolute inset-0 h-full w-full opacity-[0.22]"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <line x1="0" y1="42" x2="100" y2="42" stroke="#c7c9cc" strokeWidth="0.15" />
                  {[0, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100].map((x) => (
                    <line key={`v-${x}`} x1={x} y1="100" x2="50" y2="42" stroke="#c7c9cc" strokeWidth="0.12" />
                  ))}
                  {[100, 90, 81, 73, 66, 60, 55, 50, 46].map((y) => (
                    <line key={`h-${y}`} x1="0" y1={y} x2="100" y2={y} stroke="#c7c9cc" strokeWidth="0.1" />
                  ))}
                </svg>
              )}

              {/* Rubble / structural silhouettes for depth cues */}
              <svg className="absolute inset-0 h-full w-full opacity-70" preserveAspectRatio="none">
                <polygon points="0,320 140,260 260,340 0,400" fill="#141414" />
                <polygon points="700,20 900,0 1000,90 780,120" fill="#161616" />
                <polygon points="380,400 470,300 560,320 610,400" fill="#101010" />
              </svg>

              {/* Vignette */}
              <div
                className="absolute inset-0"
                style={{
                  background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.7) 100%)",
                }}
              />

              {/* Animated sensor grain */}
              {mode === "visual" && <NoiseLayer intensity={interference ? 0.18 : 0.07} />}

              {/* Static scanline texture */}
              <div className="scanlines absolute inset-0 opacity-60" />

              {/* Slow moving scan sweep */}
              <div className="absolute inset-y-0 left-0 w-full animate-scan bg-gradient-to-b from-transparent via-steel-400/[0.03] to-transparent" />

              {/* Interference glitch bars */}
              {interference && (
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  <div
                    className="absolute inset-x-0 top-[28%] h-[5%] bg-ink-100/15 mix-blend-overlay"
                    style={{ transform: "translateX(6px)" }}
                  />
                  <div
                    className="absolute inset-x-0 top-[61%] h-[3%] bg-ink-100/10 mix-blend-overlay"
                    style={{ transform: "translateX(-9px)" }}
                  />
                  <div
                    className="absolute inset-x-0 top-[80%] h-[2%] bg-ink-100/10 mix-blend-overlay"
                    style={{ transform: "translateX(4px)" }}
                  />
                </div>
              )}
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
          <div className="flex flex-col gap-1.5">
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
              {showFeed && interference && (
                <div className="flex items-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 backdrop-blur-sm animate-pulse-dot">
                  <WifiOff className="h-3 w-3 text-amber-400" />
                  <span className="font-mono text-[10.5px] tracking-wide text-amber-300">SIGNAL INTERFERENCE</span>
                </div>
              )}
            </div>
            {showFeed && (
              <div className="rounded-md bg-base-950/60 px-2 py-1 font-mono text-[10px] tracking-wide text-ink-500 backdrop-blur-sm">
                CAM-04 &middot; MONO-IR &middot; GAIN AUTO &middot; EXP 1/60 &middot; WB AUTO
              </div>
            )}
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
              <span className="h-3 w-px bg-border" />
              <Aperture className="h-3.5 w-3.5 text-steel-400" />
              <span className="font-mono text-[11px] text-ink-200 tabular-nums">
                F{String(frameCount).padStart(6, "0")}
              </span>
              {primaryDetection?.stage === "confirmed" && (
                <>
                  <span className="h-3 w-px bg-border" />
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                  <span className="font-mono text-[11px] text-amber-300">Verify recommended</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={signalLevel <= 2 ? "warning" : "outline"} className="bg-base-950/70 backdrop-blur-sm tabular-nums">
                {signalDbm} dBm
              </Badge>
              <Badge variant="outline" className="bg-base-950/70 backdrop-blur-sm">
                720p &middot; MONO &middot; 24fps
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