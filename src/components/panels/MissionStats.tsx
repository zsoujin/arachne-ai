import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart3, Footprints, Users, Boxes, Clock } from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { useSimulation } from "@/state/SimulationContext";

export function MissionStats() {
  const { distanceKm, victimsFound, objectsDetected, elapsedSeconds, coverage } = useSimulation();

  const stats = [
    { icon: Footprints, label: "Distance Traveled", value: distanceKm.toFixed(2), unit: "km" },
    { icon: Users, label: "Victims Found", value: String(victimsFound), unit: "" },
    { icon: Boxes, label: "Objects Detected", value: String(objectsDetected), unit: "" },
    { icon: Clock, label: "Mission Duration", value: formatDuration(elapsedSeconds), unit: "" },
  ];

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <BarChart3 className="h-3.5 w-3.5" /> Mission Statistics
        </CardTitle>
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-moss-400">
          <span className="h-1.5 w-1.5 rounded-full bg-moss-400 animate-pulse-dot" />
          LIVE
        </span>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-3">
        <div className="grid grid-cols-2 gap-2.5">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-lg border border-border bg-base-850/50 p-2.5"
            >
              <s.icon className="mb-1.5 h-3.5 w-3.5 text-steel-400" />
              <p className="font-mono text-[15px] leading-none text-ink-100 tabular-nums transition-all duration-300">
                {s.value}
                <span className="ml-0.5 text-[10px] text-ink-500">{s.unit}</span>
              </p>
              <p className="mt-1 text-[10px] leading-tight text-ink-500">{s.label}</p>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] text-ink-400">Sector Coverage</span>
            <span className="font-mono text-[12px] text-ink-200 tabular-nums">
              {coverage.toFixed(0)}%
            </span>
          </div>
          <Progress
            value={coverage}
            indicatorClassName="bg-steel-500 transition-[width] duration-1000 ease-out"
          />
        </div>
      </CardContent>
    </Card>
  );
}
