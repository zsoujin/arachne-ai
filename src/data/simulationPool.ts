import type { LogEntry } from "@/types";

export type LogPoolEntry = Pick<LogEntry, "type" | "message" | "confidence">;

// Streamed periodically into the mission log, oldest first within each pool.
export const reasoningPool: LogPoolEntry[] = [
  { type: "reasoning", message: "Re-evaluating path cost after new debris classification." },
  { type: "reasoning", message: "Confidence in Survivor Bravo detection rising with repeated thermal passes.", confidence: 78 },
  { type: "reasoning", message: "Weighing route through Grid C-2 against structural risk score." },
  { type: "reasoning", message: "Prioritizing thermal cluster over low-confidence motion trigger." },
  { type: "reasoning", message: "Cross-referencing acoustic ping with thermal map, correlation strengthening." },
  { type: "reasoning", message: "Victim confidence increased to 97% after multi-frame thermal fusion.", confidence: 97 },
  { type: "reasoning", message: "Discounting reflective surface as false thermal positive." },
  { type: "reasoning", message: "Adjusting gait plan for wet, uneven debris surface ahead." },
];

export const detectionPool: LogPoolEntry[] = [
  { type: "detection", message: "Secondary thermal bloom logged, 29.8\u00b0C, monitoring for movement." },
  { type: "detection", message: "Rebar fragment identified, non-hazardous, logged for mapping." },
  { type: "detection", message: "Faint acoustic signal detected, frequency consistent with tapping." },
  { type: "detection", message: "New debris cluster mapped, volume approx. 2.1m\u00b3." },
  { type: "detection", message: "Ambient smoke particulate rising, ventilation risk flagged." },
  { type: "detection", message: "Object classified as structural beam, load-bearing, avoid contact." },
];

export const navigationPool: LogPoolEntry[] = [
  { type: "navigation", message: "Adjusting heading to bypass unstable footing." },
  { type: "navigation", message: "Waypoint C-1 reached, resuming thermal sweep pattern." },
  { type: "navigation", message: "Gait switched to wide stance for improved stability." },
  { type: "navigation", message: "Recalculating shortest safe path to next search grid." },
  { type: "navigation", message: "Slope incline detected, reducing speed to 0.4 m/s." },
];

export const systemPool: LogPoolEntry[] = [
  { type: "system", message: "Telemetry uplink refreshed, mesh network stable." },
  { type: "system", message: "Onboard diagnostics nominal, all subsystems reporting." },
  { type: "system", message: "Thermal camera recalibrated for ambient temperature shift." },
  { type: "system", message: "Local map buffer synced to command console." },
];

export const alertPool: LogPoolEntry[] = [
  { type: "alert", message: "Minor tremor detected nearby, pausing to reassess stability." },
  { type: "alert", message: "Battery threshold approaching, recommend resupply after sector clear." },
  { type: "alert", message: "Signal degradation detected, switching to mesh relay." },
];

// Robot roams these waypoints in Sector B, looping continuously.
export const robotWaypoints: { x: number; y: number }[] = [
  { x: 58, y: 34 },
  { x: 64, y: 29 },
  { x: 70, y: 25 },
  { x: 74, y: 21 },
  { x: 70, y: 30 },
  { x: 71, y: 45 },
  { x: 71, y: 52 },
  { x: 64, y: 47 },
  { x: 58, y: 34 },
];

// Transient objects that blip onto the camera feed briefly, then clear.
export const transientDetections: {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  kind: "survivor" | "hazard" | "object";
  confidence: number;
}[] = [
  { x: 14, y: 60, w: 12, h: 10, label: "Debris cluster", kind: "object", confidence: 68 },
  { x: 40, y: 15, w: 10, h: 14, label: "Motion trigger", kind: "object", confidence: 52 },
  { x: 66, y: 62, w: 14, h: 12, label: "Thermal bloom", kind: "hazard", confidence: 61 },
  { x: 20, y: 40, w: 11, h: 9, label: "Structural beam", kind: "hazard", confidence: 84 },
  { x: 82, y: 55, w: 10, h: 12, label: "Possible signal", kind: "survivor", confidence: 57 },
];
