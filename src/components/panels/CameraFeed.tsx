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
  SignalHigh,
  SignalMedium,
  SignalLow,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, formatClock, formatDuration } from "@/lib/utils";
import { useSimulation } from "@/state/SimulationContext";

// Simulated mission playback — an ordered list of camera frame filenames.
// No real image assets exist for these; they are referenced only. If they
// fail to load, the synthetic scene (grid/vignette/noise/scanlines) behind
// them still reads as a live feed. Fully self-contained React state, zero
// backend, AI, or network dependency.
const missionFrames = [
  "frame1.jpg",
  "frame2.jpg",
  "frame3.jpg",
  "frame4.jpg",
  "frame5.jpg",
];

const FRAME_DURATION_MS = 8000;

interface FrameLogEvent {
  /** ms offset within the frame's 8s window */
  atMs: number;
  message: string;
}

interface FrameDetection {
  label: string;
  style: string;
  box: { x: number; y: number; w: number; h: number };
  confidenceStart: number;
  confidenceEnd: number;
  locked?: boolean;
}

interface FrameScriptEntry {
  logs: FrameLogEvent[];
  detection?: FrameDetection;
}

// The mission script driving both the on-screen event caption and the
// object-detection overlay, one entry per frame in `missionFrames`.
const frameScript: FrameScriptEntry[] = [
  {
    // Frame 1 — Mission started / Scanning environment
    logs: [
      { atMs: 200, message: "Mission started" },
      { atMs: 4200, message: "Scanning environment" },
    ],
  },
  {
    // Frame 2 — Obstacle detected / Route replanned
    logs: [
      { atMs: 200, message: "Obstacle detected" },
      { atMs: 4200, message: "Route replanned" },
    ],
    detection: {
      label: "Obstacle",
      style: "border-amber-500/70 text-amber-300",
      box: { x: 32, y: 46, w: 24, h: 22 },
      confidenceStart: 79,
      confidenceEnd: 79,
    },
  },
  {
    // Frame 3 — Thermal anomaly detected / Cross-checking thermal data
    logs: [
      { atMs: 200, message: "Thermal anomaly detected" },
      { atMs: 4200, message: "Cross-checking thermal data" },
    ],
    detection: {
      label: "Thermal anomaly",
      style: "border-amber-500/70 text-amber-300 border-dashed",
      box: { x: 56, y: 28, w: 16, h: 24 },
      confidenceStart: 37,
      confidenceEnd: 54,
    },
  },
  {
    // Frame 4 — Possible survivor detected / Confidence increases gradually
    logs: [
      { atMs: 200, message: "Possible survivor detected" },
      { atMs: 3600, message: "Confidence increasing" },
    ],
    detection: {
      label: "Possible survivor",
      style: "border-steel-400 text-steel-300",
      box: { x: 58, y: 22, w: 15, h: 27 },
      confidenceStart: 52,
      confidenceEnd: 91,
    },
  },
  {
    // Frame 5 — Mission complete / Operator notified
    logs: [
      { atMs: 200, message: "Mission complete" },
      { atMs: 4000, message: "Operator notified" },
    ],
    detection: {
      label: "Human detected",
      style: "border-moss-400 text-moss-300",
      box: { x: 58, y: 22, w: 15, h: 27 },
      confidenceStart: 96,
      confidenceEnd: 96,
      locked: true,
    },
  },
];

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
    sensorOcclusion,
    signalLevel,
    signalDbm,
    missionComplete,
  } = useSimulation();
  const [mode, setMode] = useState<"visual" | "thermal">("visual");
  const [localGlitch, setLocalGlitch] = useState(false);

  const [frameIndex, setFrameIndex] = useState(0);
  const [frameElapsed, setFrameElapsed] = useState(0);
  const [playbackDone, setPlaybackDone] = useState(false);
  const [failedFrames, setFailedFrames] = useState<Set<string>>(new Set());
  const [now, setNow] = useState(() => new Date());

  const bootIndex =
    cameraStage === "connecting-1" ? 0 : cameraStage === "connecting-2" ? 1 : cameraStage === "connecting-3" ? 2 : 3;
  const showBoot = cameraStage !== "idle" && cameraStage !== "online";
  const showFeed = cameraStage === "online";

  // Live timestamp, ticks regardless of mission state.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Mission playback: advance through missionFrames every 8s, driven by a
  // single interval that also powers the synced log caption and the
  // gradually-rising confidence readout. Freezes on the final frame once
  // the script completes rather than looping.
  useEffect(() => {
    if (!showFeed) return;
    setFrameIndex(0);
    setFrameElapsed(0);
    setPlaybackDone(false);

    let idx = 0;
    let frameStart = Date.now();

    const id = setInterval(() => {
      const elapsed = Date.now() - frameStart;
      if (elapsed >= FRAME_DURATION_MS) {
        if (idx < missionFrames.length - 1) {
          idx += 1;
          frameStart = Date.now();
          setFrameIndex(idx);
          setFrameElapsed(0);
        } else {
          setFrameElapsed(FRAME_DURATION_MS);
          setPlaybackDone(true);
          clearInterval(id);
        }
      } else {
        setFrameElapsed(elapsed);
      }
    }, 150);

    return () => clearInterval(id);
  }, [showFeed]);

  // Once the mission is complete, forcibly pin playback to the last frame
  // at its final confidence value. This guarantees the feed freezes on a
  // real image/overlay state instead of relying on timing coincidences
  // between the camera's own 8s-per-frame playback and the overall
  // mission timeline finishing.
  useEffect(() => {
    if (!missionComplete) return;
    setFrameIndex(missionFrames.length - 1);
    setFrameElapsed(FRAME_DURATION_MS);
    setPlaybackDone(true);
    setLocalGlitch(false);
  }, [missionComplete]);

  const currentScript = frameScript[frameIndex];
  const activeLog =
    [...currentScript.logs].reverse().find((l) => l.atMs <= frameElapsed) ?? currentScript.logs[0];
  const detection = currentScript.detection;
  const confidenceProgress = detection ? Math.min(1, frameElapsed / FRAME_DURATION_MS) : 0;
  const confidenceNow = detection
    ? Math.round(detection.confidenceStart + (detection.confidenceEnd - detection.confidenceStart) * confidenceProgress)
    : 0;

  const SignalIcon = signalLevel >= 4 ? SignalHigh : signalLevel === 3 ? SignalMedium : SignalLow;

  // Occasional signal interference, independent of any single upstream
  // system: brief static/glitch bursts every ~6-15s, on top of whatever the
  // simulation's own sensor-occlusion / weak-signal state is doing.
  // Stops scheduling entirely once the mission is complete.
  useEffect(() => {
    if (!showFeed || missionComplete) return;
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
  }, [showFeed, missionComplete]);

  // All animated overlays (glitch bars, interference badge, noise grain)
  // freeze once the mission has finished, regardless of what the
  // underlying signal/occlusion state happened to be at that instant.
  const interference = !missionComplete && (localGlitch || sensorOcclusion || signalLevel <= 2);
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

              {/* Simulated mission frame playback — crossfades between
                  entries in `missionFrames` every 8s. No real image files
                  are bundled; if a frame fails to load it's simply hidden,
                  leaving the synthetic scene above/below as the visible
                  "footage". */}
              {mode === "visual" && (
                <div className="absolute inset-0">
                  {missionFrames.map((src, i) => (
                    <img
                      key={src}
                      src={src}
                      alt=""
                      onError={() => setFailedFrames((prev) => new Set(prev).add(src))}
                      className="absolute inset-0 h-full w-full object-cover grayscale contrast-125 brightness-[0.65] transition-opacity duration-[900ms] ease-in-out"
                      style={{ opacity: i === frameIndex && !failedFrames.has(src) ? 1 : 0 }}
                    />
                  ))}
                </div>
              )}

              {/* Vignette */}
              <div
                className="absolute inset-0"
                style={{
                  background: "radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.7) 100%)",
                }}
              />

              {/* Animated sensor grain — stilled once the mission is complete */}
              {mode === "visual" && (
                <NoiseLayer intensity={missionComplete ? 0 : interference ? 0.18 : 0.07} />
              )}

              {/* Static scanline texture */}
              <div className="scanlines absolute inset-0 opacity-60" />

              {/* Slow moving scan sweep — stopped once the mission is complete */}
              <div
                className={cn(
                  "absolute inset-y-0 left-0 w-full bg-gradient-to-b from-transparent via-steel-400/[0.03] to-transparent",
                  !missionComplete && "animate-scan"
                )}
              />

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

            {/* Object detection box + confidence/detection label, driven by
                the current frame's mission script entry */}
            {detection && (
              <div
                key={frameIndex}
                className={cn(
                  "absolute rounded-[3px] border-[1.5px] transition-all duration-500 animate-fade-in",
                  detection.style,
                  detection.locked && "bracket-corners",
                  detection.locked && !missionComplete && "animate-lock-pulse"
                )}
                style={{
                  left: `${detection.box.x}%`,
                  top: `${detection.box.y}%`,
                  width: `${detection.box.w}%`,
                  height: `${detection.box.h}%`,
                }}
              >
                {detection.locked && (
                  <>
                    <div className="bc-tr" />
                    <div className="bc-bl" />
                  </>
                )}
                <span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-base-950/85 px-1.5 py-[1px] font-mono text-[10px]">
                  {detection.label} &middot; {confidenceNow}%
                </span>
              </div>
            )}

            {/* Mission event caption, synchronized with the frame/log script.
                Once the mission is complete this is replaced by a persistent
                completion banner — the last frame stays visible behind it. */}
            {missionComplete ? (
              <div className="absolute inset-x-0 bottom-14 flex justify-center px-3">
                <div className="animate-fade-in rounded-lg border border-moss-500/40 bg-base-950/85 px-4 py-2.5 text-center backdrop-blur-sm">
                  <p className="font-mono text-[13px] font-semibold tracking-[0.12em] text-moss-400">
                    MISSION COMPLETE
                  </p>
                  <p className="mt-1 text-[11.5px] leading-snug text-ink-200">
                    Robot awaiting operator instructions.
                  </p>
                  <p className="text-[11.5px] leading-snug text-ink-400">
                    Mission successfully finished.
                  </p>
                </div>
              </div>
            ) : (
              <div className="absolute inset-x-0 bottom-14 flex justify-start px-3">
                <div
                  key={`${frameIndex}-${activeLog.message}`}
                  className="animate-fade-in rounded-md bg-base-950/70 px-2.5 py-1 font-mono text-[11px] tracking-wide text-steel-300 backdrop-blur-sm"
                >
                  {activeLog.message}
                  {playbackDone && frameIndex === missionFrames.length - 1 && (
                    <span className="ml-2 text-ink-500">&middot; playback complete</span>
                  )}
                </div>
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
                    showFeed && !missionComplete
                      ? "fill-rose-500 text-rose-500 animate-pulse-dot"
                      : "fill-ink-600 text-ink-600"
                  )}
                />
                <span
                  className={cn(
                    "font-mono text-[11px] tracking-wide",
                    showFeed && !missionComplete ? "text-rose-400" : "text-ink-600"
                  )}
                >
                  {showFeed && missionComplete ? "END" : "REC"}
                </span>
              </div>
              <div className="rounded-md bg-base-950/70 px-2 py-1 font-mono text-[11px] text-ink-300 backdrop-blur-sm tabular-nums">
                {formatDuration(elapsedSeconds)}
              </div>
              {showFeed && (
                <div className="rounded-md bg-base-950/70 px-2 py-1 font-mono text-[11px] text-ink-400 backdrop-blur-sm tabular-nums">
                  {formatClock(now)}
                </div>
              )}
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
              <div className="flex items-center gap-1.5 rounded-md bg-base-950/70 px-2 py-1 backdrop-blur-sm">
                <SignalIcon className={cn("h-3 w-3", signalLevel <= 2 ? "text-amber-400" : "text-steel-300")} />
                <span
                  className={cn(
                    "font-mono text-[11px] tabular-nums",
                    signalLevel <= 2 ? "text-amber-300" : "text-ink-300"
                  )}
                >
                  {signalDbm} dBm
                </span>
              </div>
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
              {detection?.locked && (
                <>
                  <span className="h-3 w-px bg-border" />
                  <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                  <span className="font-mono text-[11px] text-amber-300">Verify recommended</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
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