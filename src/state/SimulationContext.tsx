import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { missionLog as initialLog } from "@/data/mockData";
import { robotWaypoints, targetSurvivorLocation } from "@/data/simulationPool";
import { missionTimeline, cameraBootSequence } from "@/data/missionScript";
import type { LogEntry, MissionStatus, DetectionStage, CameraStage } from "@/types";

function nowStamp() {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

interface MotorLeg {
  id: string;
  status: "ok" | "warn";
}

interface PrimaryDetection {
  stage: DetectionStage;
  confidence: number;
  thermalConf?: number;
  visualConf?: number;
}

interface SimulationState {
  missionStatus: MissionStatus;
  missionRunning: boolean;
  startMission: () => void;
  haltMission: (reason: "stop" | "return-home" | "emergency") => void;

  cameraStage: CameraStage;
  cameraBootLines: string[];

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
  trail: { x: number; y: number }[];
  hazardsVisible: string[];
  survivorConfirmed: boolean;
  survivorLocation: { x: number; y: number };

  primaryDetection: PrimaryDetection | null;

  missionLog: LogEntry[];
  aiThinking: boolean;
  newEntryId: string | null;
  revealedIds: Set<string>;
  markRevealed: (id: string) => void;

  commsStable: boolean;
  lowVisibility: boolean;
  sensorOcclusion: boolean;
  humanApprovalRequired: boolean;
  emergencyStopAvailable: boolean;
}

const SimulationContext = createContext<SimulationState | null>(null);

const LEG_IDS = ["L1", "L2", "L3", "R1", "R2", "R3"];
const HOME_POS = robotWaypoints[0];

export function SimulationProvider({ children }: { children: ReactNode }) {
  const [missionStatus, setMissionStatus] = useState<MissionStatus>("standby");
  const [cameraStage, setCameraStage] = useState<CameraStage>("idle");

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [battery, setBattery] = useState(91);
  const [signalLevel, setSignalLevel] = useState(3);
  const [signalDbm, setSignalDbm] = useState(-58);
  const [robotStatus, setRobotStatus] = useState<"operational" | "degraded">("operational");
  const [cpuLoad, setCpuLoad] = useState(18);
  const [temperature, setTemperature] = useState(41);
  const [motorLegs, setMotorLegs] = useState<MotorLeg[]>(
    LEG_IDS.map((id) => ({ id, status: "ok" as const }))
  );

  const [coverage, setCoverage] = useState(0);
  const [distanceKm, setDistanceKm] = useState(0);
  const [objectsDetected, setObjectsDetected] = useState(0);
  const [victimsFound, setVictimsFound] = useState(0);

  const [robotPos, setRobotPos] = useState(HOME_POS);
  const [trail, setTrail] = useState([HOME_POS]);
  const [hazardsVisible, setHazardsVisible] = useState<string[]>([]);
  const [survivorConfirmed, setSurvivorConfirmed] = useState(false);

  const [primaryDetection, setPrimaryDetection] = useState<PrimaryDetection | null>(null);

  const [missionLog, setMissionLog] = useState<LogEntry[]>(initialLog);
  const [aiThinking, setAiThinking] = useState(false);
  const [newEntryId, setNewEntryId] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  const [sensorOcclusion, setSensorOcclusion] = useState(false);

  const missionRunning =
    missionStatus === "initializing" ||
    missionStatus === "exploring" ||
    missionStatus === "target-detected";

  const waypointIndex = useRef(0);
  const thinkingTimeout = useRef<ReturnType<typeof setTimeout>>();
  const timelineTimeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimeline = () => {
    timelineTimeouts.current.forEach((id) => clearTimeout(id));
    timelineTimeouts.current = [];
    clearTimeout(thinkingTimeout.current);
  };

  const markRevealed = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const pushEntry = (
    template: { type: LogEntry["type"]; message: string; confidence?: number },
    withThinking: boolean
  ) => {
    const commit = () => {
      const entry: LogEntry = {
        id: uid(),
        timestamp: nowStamp(),
        type: template.type,
        message: template.message,
        confidence: template.confidence,
      };
      setMissionLog((prev) => [entry, ...prev].slice(0, 60));
      setNewEntryId(entry.id);
      setAiThinking(false);
      if (template.type === "detection") setObjectsDetected((v) => v + 1);
    };

    if (withThinking) {
      setAiThinking(true);
      const id = setTimeout(commit, 1100 + Math.random() * 700);
      timelineTimeouts.current.push(id);
      thinkingTimeout.current = id;
    } else {
      commit();
    }
  };

  const runTimeline = () => {
    let cumulative = 0;
    missionTimeline.forEach((step) => {
      cumulative += step.delay;
      const id = setTimeout(() => {
        if (step.status) setMissionStatus(step.status);
        if (step.detection) setPrimaryDetection(step.detection);
        if (step.hazardId) {
          setHazardsVisible((prev) =>
            prev.includes(step.hazardId!) ? prev : [...prev, step.hazardId!]
          );
        }
        if (step.survivor) {
          setVictimsFound((v) => v + 1);
          setSurvivorConfirmed(true);
        }
        if (step.log) pushEntry(step.log, !!step.log.withThinking);
      }, cumulative);
      timelineTimeouts.current.push(id);
    });
  };

  const startMission = () => {
    if (missionRunning) return;
    clearTimeline();

    setMissionStatus("initializing");
    setCameraStage("connecting-1");
    setTrail([HOME_POS]);
    waypointIndex.current = 0;
    setRobotPos(HOME_POS);
    setSurvivorConfirmed(false);
    setHazardsVisible([]);
    setPrimaryDetection(null);
    setDistanceKm(0);
    setCoverage(0);
    setObjectsDetected(0);
    setVictimsFound(0);
    setElapsedSeconds(0);

    const c1 = setTimeout(() => setCameraStage("connecting-2"), 650);
    const c2 = setTimeout(() => setCameraStage("connecting-3"), 1300);
    const c3 = setTimeout(() => setCameraStage("online"), 2000);
    timelineTimeouts.current.push(c1, c2, c3);

    runTimeline();
  };

  const haltMission = (reason: "stop" | "return-home" | "emergency") => {
    clearTimeline();
    const template =
      reason === "emergency"
        ? { type: "alert" as const, message: "EMERGENCY STOP ACTIVATED. All motion halted immediately." }
        : reason === "return-home"
          ? { type: "navigation" as const, message: "Returning to home position. Mission ended." }
          : { type: "system" as const, message: "Mission halted by operator command." };
    pushEntry(template, false);
    setMissionStatus("standby");
    setCameraStage("idle");
  };

  useEffect(() => {
    if (!missionRunning) return;
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [missionRunning]);

  useEffect(() => {
    const id = setInterval(() => {
      setBattery((b) => Math.max(11, +(b - (missionRunning ? 0.25 : 0.03)).toFixed(1)));
    }, 4000);
    return () => clearInterval(id);
  }, [missionRunning]);

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

  useEffect(() => {
    const id = setInterval(() => {
      if (missionRunning && Math.random() < 0.06) {
        setRobotStatus("degraded");
        setTimeout(() => setRobotStatus("operational"), 3500 + Math.random() * 2000);
      }
    }, 9000);
    return () => clearInterval(id);
  }, [missionRunning]);

  useEffect(() => {
    const id = setInterval(() => {
      if (missionRunning) {
        setCpuLoad((v) => Math.min(78, Math.max(32, v + Math.round((Math.random() - 0.5) * 14))));
        setTemperature((v) => Math.min(68, Math.max(46, +(v + (Math.random() - 0.5) * 3).toFixed(1))));
      } else {
        setCpuLoad((v) => Math.min(24, Math.max(12, v + Math.round((Math.random() - 0.5) * 4))));
        setTemperature((v) => Math.min(45, Math.max(36, +(v + (Math.random() - 0.5) * 1.2).toFixed(1))));
      }
    }, 3200);
    return () => clearInterval(id);
  }, [missionRunning]);

  useEffect(() => {
    const id = setInterval(() => {
      if (missionRunning && Math.random() < 0.22) {
        const idx = Math.floor(Math.random() * LEG_IDS.length);
        setMotorLegs((prev) =>
          prev.map((leg, i) =>
            i === idx ? { ...leg, status: leg.status === "ok" ? "warn" : "ok" } : leg
          )
        );
      }
    }, 6000);
    return () => clearInterval(id);
  }, [missionRunning]);

  useEffect(() => {
    const id = setInterval(() => {
      if (missionRunning && Math.random() < 0.15) {
        setSensorOcclusion(true);
        setTimeout(() => setSensorOcclusion(false), 2600 + Math.random() * 1800);
      }
    }, 8000);
    return () => clearInterval(id);
  }, [missionRunning]);

  useEffect(() => {
    const id = setInterval(() => {
      if (!missionRunning) return;
      setCoverage((v) => Math.min(96, +(v + 1.1 + Math.random() * 1.4).toFixed(1)));
      setDistanceKm((v) => +(v + 0.02 + Math.random() * 0.02).toFixed(3));
    }, 2200);
    return () => clearInterval(id);
  }, [missionRunning]);

  useEffect(() => {
    const id = setInterval(() => {
      if (!missionRunning) return;
      setRobotPos((pos) => {
        const target = robotWaypoints[waypointIndex.current];
        const dx = target.x - pos.x;
        const dy = target.y - pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 0.6) {
          waypointIndex.current = (waypointIndex.current + 1) % robotWaypoints.length;
          return pos;
        }
        const next = { x: lerp(pos.x, target.x, 0.06), y: lerp(pos.y, target.y, 0.06) };
        setTrail((prevTrail) => {
          const last = prevTrail[prevTrail.length - 1];
          if (!last || Math.hypot(last.x - next.x, last.y - next.y) > 1.2) {
            return [...prevTrail, next].slice(-120);
          }
          return prevTrail;
        });
        return next;
      });
    }, 150);
    return () => clearInterval(id);
  }, [missionRunning]);

  useEffect(() => clearTimeline, []);

  const value: SimulationState = {
    missionStatus,
    missionRunning,
    startMission,
    haltMission,
    cameraStage,
    cameraBootLines: cameraBootSequence,
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
    trail,
    hazardsVisible,
    survivorConfirmed,
    survivorLocation: targetSurvivorLocation,
    primaryDetection,
    missionLog,
    aiThinking,
    newEntryId,
    revealedIds,
    markRevealed,
    commsStable: signalLevel > 1,
    lowVisibility: primaryDetection?.stage === "thermal" || primaryDetection?.stage === "possible",
    sensorOcclusion,
    humanApprovalRequired: missionStatus === "target-detected" && primaryDetection?.stage === "confirmed",
    emergencyStopAvailable: true,
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
