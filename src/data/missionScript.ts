import type { DetectionStage, LogEntry, MissionStatus } from "@/types";

export interface MissionStep {
  /** ms after the previous step fires */
  delay: number;
  status?: MissionStatus;
  log?: {
    type: LogEntry["type"];
    message: string;
    withThinking?: boolean;
    confidence?: number;
  };
  detection?: {
    stage: DetectionStage;
    confidence: number;
    thermalConf?: number;
    visualConf?: number;
  };
  hazardId?: string;
  survivor?: boolean;
}

export const missionTimeline: MissionStep[] = [
  { delay: 400, log: { type: "system", message: "Initializing navigation model..." } },
  {
    delay: 2600,
    status: "exploring",
    log: { type: "detection", message: "Terrain classified as unstable." },
  },
  { delay: 2200, log: { type: "navigation", message: "Switching to cautious gait." } },
  {
    delay: 2600,
    hazardId: "hz-1",
    log: { type: "detection", message: "Structural instability mapped near Grid B-6." },
  },
  {
    delay: 2800,
    log: { type: "alert", message: "Thermal anomaly detected.", confidence: 41 },
    detection: { stage: "thermal", confidence: 41, thermalConf: 41 },
  },
  {
    delay: 2600,
    log: { type: "detection", message: "Motion detected.", confidence: 58 },
    detection: { stage: "possible", confidence: 58, visualConf: 58 },
  },
  {
    delay: 3000,
    log: {
      type: "reasoning",
      message: "Cross-checking thermal and motion signatures.",
      withThinking: true,
    },
    detection: { stage: "crosscheck", confidence: 61, thermalConf: 44, visualConf: 61 },
  },
  {
    delay: 2800,
    hazardId: "hz-3",
    log: { type: "detection", message: "Gas line exposure logged nearby, proceeding with caution." },
  },
  { delay: 2400, log: { type: "system", message: "False positive rejected on secondary trigger." } },
  {
    delay: 3200,
    status: "target-detected",
    log: { type: "reasoning", message: "Human presence confirmed.", withThinking: true, confidence: 96 },
    detection: { stage: "confirmed", confidence: 96, thermalConf: 42, visualConf: 61 },
    survivor: true,
  },
  {
    delay: 2800,
    log: {
      type: "reasoning",
      message:
        "Thermal confidence 42%. Visual confidence 61%. Combined confidence 96%. Operator verification recommended.",
    },
  },
  { delay: 2600, log: { type: "system", message: "Operator notification generated." } },
  { delay: 3400, log: { type: "navigation", message: "Route replanned around unstable debris." } },
  {
    delay: 2800,
    hazardId: "hz-2",
    log: { type: "detection", message: "Secondary structural crack logged." },
  },
  {
    delay: 2600,
    log: { type: "detection", message: "Secondary thermal signature logged, confidence 34%.", confidence: 34 },
  },
  { delay: 3000, log: { type: "system", message: "Mission objective updated." } },
  { delay: 3200, log: { type: "navigation", message: "Resuming sector sweep pattern." } },
  {
    delay: 3400,
    log: {
      type: "reasoning",
      message: "Sector coverage exceeding threshold, preparing mission summary.",
      withThinking: true,
    },
  },
  {
    delay: 2800,
    status: "complete",
    log: { type: "system", message: "Mission Complete. Sector B search concluded." },
  },
];

export const cameraBootSequence = [
  "CONNECTING TO ROBOT...",
  "Establishing encrypted link...",
  "Receiving camera stream...",
  "Camera Online.",
];
