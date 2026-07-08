import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { missionLog as initialLog, survivors as initialSurvivors } from "@/data/mockData";
import {
  reasoningPool,
  detectionPool,
  navigationPool,
  systemPool,
  alertPool,
  robotWaypoints,
  transientDetections,
} from "@/data/simulationPool";
import type { LogEntry } from "@/types";

function nowStamp() {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

interface TransientBlip {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  kind: "survivor" | "hazard" | "object";
  confidence: number;
  visible: boolean;
}

interface MotorLeg {
  id: string;
  status: "ok" | "warn";
}

interface SimulationState {
  elapsedSeconds: number;
  battery: number;
  signalLevel: number;
  signalDbm: number;
  robotStatus: "operational" | "degraded";
  cpuLoad: number;
  temperature: number;
  motorLegs: MotorLeg[];
  coverage: number;
  distanceKm: number;
  objectsDetected: number;
  victimsFound: number;
  robotPos: { x: number; y: number };
  missionLog: LogEntry[];
  aiThinking: boolean;
  newEntryId: string | null;
  revealedIds: Set<string>;
  markRevealed: (id: string) => void;
  transientBlip: TransientBlip | null;
}

const SimulationContext = createContext<SimulationState | null>(null);

const LEG_IDS = ["L1", "L2", "L3", "R1", "R2", "R3"];

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(6128);
  const [battery, setBattery] = useState(68);
  const [signalLevel, setSignalLevel] = useState(3);
  const [signalDbm, setSignalDbm] = useState(-61);
  const [robotStatus, setRobotStatus] = useState<"operational" | "degraded">("operational");
  const [cpuLoad, setCpuLoad] = useState(42);
  const [temperature, setTemperature] = useState(54);
  const [motorLegs, setMotorLegs] = useState<MotorLeg[]>(
    LEG_IDS.map((id, i) => ({ id, status: i === 4 ? "warn" : "ok" }))
  );
  const [coverage, setCoverage] = useState(64);
  const [distanceKm, setDistanceKm] = useState(1.24);
  const [objectsDetected, setObjectsDetected] = useState(47);
  const [victimsFound, setVictimsFound] = useState(initialSurvivors.length);
  const [robotPos, setRobotPos] = useState(robotWaypoints[0]);
  const [missionLog, setMissionLog] = useState<LogEntry[]>(initialLog);
  const [aiThinking, setAiThinking] = useState(false);
  const [newEntryId, setNewEntryId] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [transientBlip, setTransientBlip] = useState<TransientBlip | null>(null);

  const waypointIndex = useRef(0);
  const thinkingTimeout = useRef<ReturnType<typeof setTimeout>>();

  const markRevealed = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const pushLogEntry = (pool: typeof reasoningPool, withThinking: boolean) => {
    const template = pool[Math.floor(Math.random() * pool.length)];
    const commit = () => {
      const entry: LogEntry = {
        id: uid(),
        timestamp: nowStamp(),
        type: template.type,
        message: template.message,
        confidence: template.confidence,
      };
      setMissionLog((prev) => [entry, ...prev].slice(0, 40));
      setNewEntryId(entry.id);
      setAiThinking(false);
      if (template.type === "detection") {
        setObjectsDetected((v) => v + 1);
      }
      if (template.confidence && template.confidence >= 95 && Math.random() > 0.5) {
        setVictimsFound((v) => v + 1);
      }
    };

    if (withThinking) {
      setAiThinking(true);
      clearTimeout(thinkingTimeout.current);
      thinkingTimeout.current = setTimeout(commit, 1100 + Math.random() * 700);
    } else {
      commit();
    }
  };

  // Mission clock
  useEffect(() => {
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Battery drain
  useEffect(() => {
    const id = setInterval(() => {
      setBattery((b) => Math.max(11, +(b - 0.15).toFixed(1)));
    }, 4000);
    return () => clearInterval(id);
  }, []);

  // Signal fluctuation
  useEffect(() => {
    const id = setInterval(() => {
      setSignalLevel((prev) => {
        const delta = Math.random() > 0.5 ? 1 : -1;
        return Math.min(4, Math.max(2, prev + (Math.random() > 0.7 ? delta : 0)));
      });
      setSignalDbm((prev) => {
        const drift = Math.round((Math.random() - 0.5) * 8);
        return Math.min(-48, Math.max(-88, prev + drift));
      });
    }, 3500);
    return () => clearInterval(id);
  }, []);

  // Robot status flicker (rare, self-recovering)
  useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() < 0.06) {
        setRobotStatus("degraded");
        setTimeout(() => setRobotStatus("operational"), 3500 + Math.random() * 2000);
      }
    }, 9000);
    return () => clearInterval(id);
  }, []);

  // CPU / temperature jitter
  useEffect(() => {
    const id = setInterval(() => {
      setCpuLoad((v) => Math.min(78, Math.max(28, v + Math.round((Math.random() - 0.5) * 14))));
      setTemperature((v) => Math.min(68, Math.max(46, +(v + (Math.random() - 0.5) * 3).toFixed(1))));
    }, 3200);
    return () => clearInterval(id);
  }, []);

  // Motor leg status flips
  useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() < 0.25) {
        const idx = Math.floor(Math.random() * LEG_IDS.length);
        setMotorLegs((prev) =>
          prev.map((leg, i) =>
            i === idx ? { ...leg, status: leg.status === "ok" ? "warn" : "ok" } : leg
          )
        );
      }
    }, 6000);
    return () => clearInterval(id);
  }, []);

  // Coverage + distance creep forward
  useEffect(() => {
    const id = setInterval(() => {
      setCoverage((v) => Math.min(97, +(v + Math.random() * 0.6).toFixed(1)));
      setDistanceKm((v) => +(v + Math.random() * 0.006).toFixed(3));
    }, 5000);
    return () => clearInterval(id);
  }, []);

  // Robot movement along waypoints
  useEffect(() => {
    const id = setInterval(() => {
      setRobotPos((pos) => {
        const target = robotWaypoints[waypointIndex.current];
        const dx = target.x - pos.x;
        const dy = target.y - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.6) {
          waypointIndex.current = (waypointIndex.current + 1) % robotWaypoints.length;
          return pos;
        }
        return { x: lerp(pos.x, target.x, 0.06), y: lerp(pos.y, target.y, 0.06) };
      });
    }, 150);
    return () => clearInterval(id);
  }, []);

  // Streaming mission log / AI reasoning
  useEffect(() => {
    let cancelled = false;
    const scheduleNext = () => {
      const delay = 4500 + Math.random() * 4000;
      const id = setTimeout(() => {
        if (cancelled) return;
        const roll = Math.random();
        if (roll < 0.4) pushLogEntry(reasoningPool, true);
        else if (roll < 0.65) pushLogEntry(detectionPool, false);
        else if (roll < 0.85) pushLogEntry(navigationPool, false);
        else if (roll < 0.95) pushLogEntry(systemPool, false);
        else pushLogEntry(alertPool, false);
        scheduleNext();
      }, delay);
      return id;
    };
    const timeoutId = scheduleNext();
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      clearTimeout(thinkingTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Transient camera blips
  useEffect(() => {
    const id = setInterval(() => {
      const template =
        transientDetections[Math.floor(Math.random() * transientDetections.length)];
      setTransientBlip({ ...template, id: uid(), visible: true });
      setTimeout(() => {
        setTransientBlip((prev) => (prev ? { ...prev, visible: false } : prev));
      }, 3800);
    }, 7000);
    return () => clearInterval(id);
  }, []);

  const value: SimulationState = {
    elapsedSeconds,
    battery,
    signalLevel,
    signalDbm,
    robotStatus,
    cpuLoad,
    temperature,
    motorLegs,
    coverage,
    distanceKm,
    objectsDetected,
    victimsFound,
    robotPos,
    missionLog,
    aiThinking,
    newEntryId,
    revealedIds,
    markRevealed,
    transientBlip,
  };

  return (
    <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>
  );
}

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error("useSimulation must be used within SimulationProvider");
  return ctx;
}
