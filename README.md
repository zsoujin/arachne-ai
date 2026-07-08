# Arachne AI — Field Console

A command-and-control frontend for the Arachne AI autonomous disaster-response
hexapod. Built for rescue operators to monitor the robot's live feed, review
AI reasoning, track detected survivors and hazards, and issue mission
commands.

## Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- shadcn/ui-style primitives (Radix UI under the hood)
- lucide-react icons

## Getting started

```bash
npm install
npm run dev
```

Then open the printed local URL (default `http://localhost:5173`).

## Project structure

```
src/
  components/
    layout/     TopNav, Sidebar
    panels/     CameraFeed, MiniMap, RobotHealth, MissionStats,
                MissionLogPanel, CommandBar
    ui/         Reusable shadcn-style primitives (Button, Card, Badge, ...)
  data/         Example mission data
  hooks/        Live clock / mission timer hooks
  types/        Shared TypeScript types
```

## Live simulation

There is no backend. All "live" behavior is simulated entirely on the
frontend from `src/state/SimulationContext.tsx`, which drives:

- Battery drain, signal strength/dBm drift, CPU/temperature jitter
- Occasional robot status flicker (operational \u2192 degraded \u2192 recovers)
- Motor leg status flips
- Mission coverage %, distance traveled, and objects/victims counters
- The robot's minimap position, eased along a waypoint loop every tick
- A streaming mission log: new reasoning/detection/navigation/system/alert
  entries arrive every few seconds from message pools in
  `src/data/simulationPool.ts`
- An "AI analyzing\u2026" thinking indicator before reasoning entries land,
  followed by a typewriter reveal of the new log line
- Transient camera detections that blip onto the live feed and fade out

Everything is driven by `setInterval`/`setTimeout` inside the provider and
consumed via the `useSimulation()` hook \u2014 no network calls involved.

## Design notes

Dark, grayscale-first industrial palette with a restrained steel-blue accent
(`#4576b8` family), IBM Plex Sans for UI text and IBM Plex Mono for
telemetry/data. The camera panel uses viewfinder-style corner brackets as the
console's signature detail, echoing the robot's own vision system.
