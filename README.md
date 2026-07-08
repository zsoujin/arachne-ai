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

There is no backend. Pressing **Execute Mission** kicks off a fully scripted,
~55-second mission run from `src/state/SimulationContext.tsx` and
`src/data/missionScript.ts`:

- **Mission status** cycles Standby &rarr; Initializing &rarr; Exploring &rarr;
  Target Detected &rarr; Mission Complete, reflected live in the top nav badge
- **Camera feed** plays a connect sequence (`CONNECTING TO ROBOT...` &rarr;
  `Establishing encrypted link...` &rarr; `Receiving camera stream...` &rarr;
  `Camera Online.`) before the live feed appears
- **Detections** evolve in place on the same bounding box: thermal anomaly
  (41%) &rarr; possible survivor (58%) &rarr; cross-checking (61%) &rarr; human
  detected (96%), fading in and locking on with a one-shot pulse at
  confirmation
- **Mission log** streams a scripted sequence of timestamped entries one by
  one, each typed out character-by-character, with an "AI analyzing&hellip;"
  indicator before reasoning entries land
- **Mission map** grows an explored-path trail as the robot moves, and only
  reveals hazard and survivor markers once the mission log confirms them
- **Robot health** (battery, CPU, temperature, motor legs, signal) fluctuates
  continuously, idling low in Standby and becoming more active mid-mission
- **Mission statistics** (distance, coverage, objects, victims, duration)
  reset to zero and animate up over the course of the run
- A small **Safety** panel (left sidebar, Mission Control view) shows human
  approval requirements, visibility/occlusion warnings, comms status, and
  emergency-stop availability &mdash; the AI is never presented as fully certain

Stop / Return Home / Emergency Stop all cancel the scripted timeline and
return the console to Standby with an appropriate log entry.

Everything is driven by `setTimeout`/`setInterval` inside the provider and
consumed via the `useSimulation()` hook &mdash; no network calls involved.

## Design notes

Dark, grayscale-first industrial palette with a restrained steel-blue accent
(`#4576b8` family), IBM Plex Sans for UI text and IBM Plex Mono for
telemetry/data. The camera panel uses viewfinder-style corner brackets as the
console's signature detail, echoing the robot's own vision system.
