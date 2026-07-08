import { useState } from "react";
import { Play, Square, Home, Siren, Terminal, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSimulation } from "@/state/SimulationContext";

export function CommandBar() {
  const [value, setValue] = useState("");
  const { missionRunning, startMission, haltMission } = useSimulation();

  return (
    <div className="flex shrink-0 flex-col gap-2.5 border-t border-border bg-base-900/60 p-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Terminal className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search Sector B and prioritize thermal signatures."
          className="pl-10 font-mono text-[13px]"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="default"
          size="lg"
          className="flex-1 sm:flex-none"
          disabled={missionRunning}
          onClick={startMission}
        >
          {missionRunning ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Play className="h-4 w-4" />
          )}
          {missionRunning ? "Mission Running" : "Execute Mission"}
        </Button>
        <Button variant="secondary" size="lg" onClick={() => haltMission("stop")}>
          <Square className="h-4 w-4" />
          Stop
        </Button>
        <Button variant="outline" size="lg" onClick={() => haltMission("return-home")}>
          <Home className="h-4 w-4" />
          Return Home
        </Button>
        <Button variant="destructive" size="lg" onClick={() => haltMission("emergency")}>
          <Siren className="h-4 w-4" />
          Emergency Stop
        </Button>
      </div>
    </div>
  );
}
