// Robot roams these waypoints in Sector B while a mission is active, looping continuously.
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

// Fixed location of the confirmed survivor detection for this mission script.
export const targetSurvivorLocation = { x: 74, y: 21 };
