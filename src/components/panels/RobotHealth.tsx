import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { HeartPulse } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSimulation } from "@/state/SimulationContext";

function metricColor(value: number, invert = false) {
  const good = invert ? value < 60 : value > 60;
  const warn = invert ? value < 80 : value > 35;
  if (good) return "bg-moss-500";
  if (warn) return "bg-amber-500";
  return "bg-rose-500";
}

export function RobotHealth() {
  const { battery, cpuLoad, temperature, motorLegs, signalDbm, robotStatus } = useSimulation();
  const okCount = motorLegs.filter((l) => l.status === "ok").length;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <HeartPulse className="h-3.5 w-3.5" /> Robot Health
        </CardTitle>
        <span
          className={cn(
            "font-mono text-[10px] transition-colors duration-500",
            robotStatus === "operational" ? "text-moss-400" : "text-amber-400"
          )}
        >
          {robotStatus === "operational" ? "NOMINAL" : "DEGRADED"}
        </span>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3.5">
        <Metric label="Battery" value={battery} suffix="%" />
        <Metric label="CPU Load" value={cpuLoad} suffix="%" />
        <Metric label="Temperature" value={temperature} suffix="°C" invert max={100} />

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[11px] text-ink-400">Motor Status</span>
            <span className="font-mono text-[10px] text-ink-500 transition-all duration-300">
              {okCount}/6 nominal
            </span>
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {motorLegs.map((leg) => (
              <div
                key={leg.id}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-md border py-1.5 transition-colors duration-500",
                  leg.status === "ok"
                    ? "border-moss-500/25 bg-moss-500/[0.07]"
                    : "border-amber-500/30 bg-amber-500/[0.09]"
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition-colors duration-500",
                    leg.status === "ok" ? "bg-moss-400" : "bg-amber-400 animate-pulse-dot"
                  )}
                />
                <span className="font-mono text-[9px] text-ink-400">{leg.id}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-base-850/50 px-3 py-2">
          <span className="text-[11px] text-ink-400">Network</span>
          <span className="font-mono text-[11px] text-steel-300 tabular-nums transition-all duration-300">
            Mesh &middot; 4 nodes &middot; {signalDbm}dBm
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  suffix,
  invert = false,
  max = 100,
}: {
  label: string;
  value: number;
  suffix: string;
  invert?: boolean;
  max?: number;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11px] text-ink-400">{label}</span>
        <span className="font-mono text-[12px] text-ink-200 tabular-nums">
          {value.toFixed(0)}
          {suffix}
        </span>
      </div>
      <Progress
        value={(value / max) * 100}
        indicatorClassName={cn(metricColor(value, invert), "transition-[width,background-color] duration-700 ease-out")}
      />
    </div>
  );
}
