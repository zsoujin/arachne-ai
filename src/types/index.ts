export type MissionStatus = "active" | "paused" | "returning" | "idle";
export type RobotStatus = "operational" | "degraded" | "critical" | "offline";
export type ConnectionQuality = "excellent" | "good" | "poor" | "lost";

export interface LogEntry {
  id: string;
  timestamp: string;
  type: "detection" | "reasoning" | "navigation" | "system" | "alert";
  message: string;
  confidence?: number;
}

export interface Survivor {
  id: string;
  label: string;
  confidence: number;
  location: string;
  x: number; // 0-100 position on minimap
  y: number;
}

export interface Hazard {
  id: string;
  label: string;
  severity: "low" | "medium" | "high";
  x: number;
  y: number;
  radius: number;
}

export interface QueueItem {
  id: string;
  title: string;
  status: "queued" | "in-progress" | "complete";
  eta?: string;
}

export interface HistoryItem {
  id: string;
  name: string;
  date: string;
  duration: string;
  survivorsFound: number;
  outcome: "success" | "partial" | "aborted";
}

export interface NavItem {
  id: string;
  label: string;
  count?: number;
}

export interface BoundingBox {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  kind: "survivor" | "hazard" | "object";
  confidence: number;
}
