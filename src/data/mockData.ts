import type {
  LogEntry,
  Survivor,
  Hazard,
  QueueItem,
  HistoryItem,
  BoundingBox,
} from "@/types";

export const missionLog: LogEntry[] = [
  {
    id: "log-014",
    timestamp: "14:32:08",
    type: "reasoning",
    message: "Victim confidence increased to 96% after thermal + visual fusion.",
    confidence: 96,
  },
  {
    id: "log-013",
    timestamp: "14:31:52",
    type: "navigation",
    message: "Alternative route generated around collapsed stairwell.",
  },
  {
    id: "log-012",
    timestamp: "14:31:20",
    type: "detection",
    message: "Obstacle classified as unstable concrete slab, load risk high.",
  },
  {
    id: "log-011",
    timestamp: "14:30:47",
    type: "alert",
    message: "Thermal anomaly detected, Sector B, grid ref B-7.",
  },
  {
    id: "log-010",
    timestamp: "14:29:55",
    type: "detection",
    message: "Secondary heat signature logged, 31.4\u00b0C, non-human profile likely.",
  },
  {
    id: "log-009",
    timestamp: "14:28:41",
    type: "system",
    message: "Gait switched to crawl mode for low-clearance passage.",
  },
  {
    id: "log-008",
    timestamp: "14:27:33",
    type: "reasoning",
    message: "Debris density exceeds threshold, rerouting to minimize load-bearing risk.",
  },
  {
    id: "log-007",
    timestamp: "14:26:10",
    type: "navigation",
    message: "Waypoint B-4 reached. Resuming search pattern.",
  },
  {
    id: "log-006",
    timestamp: "14:24:58",
    type: "detection",
    message: "Structural crack mapped, 2.1m span, flagged for engineering review.",
  },
  {
    id: "log-005",
    timestamp: "14:23:15",
    type: "system",
    message: "Battery at 68%. Estimated 41 min operational time remaining.",
  },
];

export const survivors: Survivor[] = [
  { id: "sv-1", label: "Survivor Alpha", confidence: 96, location: "Sector B \u00b7 Grid B-7", x: 62, y: 34 },
  { id: "sv-2", label: "Survivor Bravo", confidence: 71, location: "Sector B \u00b7 Grid B-9", x: 71, y: 52 },
  { id: "sv-3", label: "Unconfirmed thermal", confidence: 44, location: "Sector C \u00b7 Grid C-2", x: 28, y: 68 },
];

export const hazards: Hazard[] = [
  { id: "hz-1", label: "Unstable concrete slab", severity: "high", x: 58, y: 40, radius: 8 },
  { id: "hz-2", label: "Structural crack", severity: "medium", x: 44, y: 58, radius: 6 },
  { id: "hz-3", label: "Gas line exposure", severity: "high", x: 22, y: 30, radius: 7 },
  { id: "hz-4", label: "Standing water", severity: "low", x: 75, y: 22, radius: 5 },
];

export const missionQueue: QueueItem[] = [
  { id: "q-1", title: "Search Sector B \u2014 thermal priority", status: "in-progress", eta: "6 min" },
  { id: "q-2", title: "Structural survey \u2014 East stairwell", status: "queued", eta: "14 min" },
  { id: "q-3", title: "Return to Sector A for resupply beacon", status: "queued", eta: "22 min" },
  { id: "q-4", title: "Perimeter sweep \u2014 Sector D", status: "queued" },
];

export const missionHistory: HistoryItem[] = [
  { id: "h-1", name: "Overpass Collapse \u2014 Route 9", date: "Jul 06, 2026", duration: "1h 42m", survivorsFound: 3, outcome: "success" },
  { id: "h-2", name: "Warehouse Fire \u2014 District 4", date: "Jul 03, 2026", duration: "58m", survivorsFound: 1, outcome: "partial" },
  { id: "h-3", name: "Apartment Collapse \u2014 Elm St", date: "Jun 29, 2026", duration: "2h 11m", survivorsFound: 4, outcome: "success" },
  { id: "h-4", name: "Flood Response \u2014 Riverside", date: "Jun 24, 2026", duration: "37m", survivorsFound: 0, outcome: "aborted" },
];

export const boundingBoxes: BoundingBox[] = [
  { id: "bb-1", x: 58, y: 22, w: 14, h: 26, label: "Survivor Alpha", kind: "survivor", confidence: 96 },
  { id: "bb-2", x: 30, y: 55, w: 18, h: 14, label: "Unstable concrete", kind: "hazard", confidence: 88 },
  { id: "bb-3", x: 76, y: 48, w: 10, h: 10, label: "Debris cluster", kind: "object", confidence: 74 },
];

export const navItems = [
  { id: "mission-control", label: "Mission Control" },
  { id: "mission-queue", label: "Mission Queue", count: missionQueue.length },
  { id: "navigation", label: "Navigation" },
  { id: "survivors", label: "Detected Survivors", count: survivors.length },
  { id: "hazards", label: "Detected Hazards", count: hazards.length },
  { id: "history", label: "Mission History" },
  { id: "settings", label: "Settings" },
];
