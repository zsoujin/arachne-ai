import { Activity, BatteryMedium, BatteryLow, Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn, formatClock } from "@/lib/utils";
import { useLiveClock } from "@/hooks/useMissionClock";
import { useSimulation } from "@/state/SimulationContext";

function SignalBars({ level }: { level: number }) {
  return (
    <div className="flex items-end gap-[2px] h-3.5">
      {[1, 2, 3, 4].map((bar) => (
        <span
          key={bar}
          className={cn(
            "w-[3px] rounded-sm bg-base-500 transition-colors duration-500",
            bar === 1 && "h-[5px]",
            bar === 2 && "h-[8px]",
            bar === 3 && "h-[11px]",
            bar === 4 && "h-[14px]",
            bar <= level && "bg-steel-400"
          )}
        />
      ))}
    </div>
  );
}

export function TopNav() {
  const now = useLiveClock();
  const { battery, signalLevel, signalDbm, robotStatus } = useSimulation();

  const batteryLow = battery < 25;
  const BatteryIcon = batteryLow ? BatteryLow : BatteryMedium;
  const batteryColor = batteryLow ? "text-amber-400" : "text-moss-400";

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-base-900/80 px-5 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <div className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-steel-700/50 bg-steel-950">
          <svg viewBox="0 0 32 32" className="h-5 w-5">
            <circle cx="16" cy="16" r="14.5" stroke="#6f97cd" strokeWidth="1.4" fill="none" />
            <circle cx="16" cy="16" r="3.4" fill="#6f97cd" />
            <path
              d="M16 3V9M16 23V29M3 16H9M23 16H29M6.5 6.5L10.5 10.5M21.5 21.5L25.5 25.5M25.5 6.5L21.5 10.5M10.5 21.5L6.5 25.5"
              stroke="#6f97cd"
              strokeWidth="1.1"
            />
          </svg>
        </div>
        <div className="leading-tight">
          <div className="flex items-center gap-2">
            <h1 className="text-[15px] font-semibold tracking-tight text-ink-100">
              Arachne AI
            </h1>
            <span className="rounded border border-border px-1.5 py-[1px] font-mono text-[10px] text-ink-500">
              FIELD CONSOLE
            </span>
          </div>
          <p className="font-mono text-[11px] text-ink-500">UNIT-07 &middot; ARA-2291</p>
        </div>
      </div>

      <div className="hidden items-center gap-2.5 md:flex">
        <Badge variant="active">
          <Activity className="h-3 w-3" />
          Mission Active
        </Badge>
        <Badge
          variant={robotStatus === "operational" ? "success" : "warning"}
          className="transition-colors duration-500"
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full animate-pulse-dot",
              robotStatus === "operational" ? "bg-moss-400" : "bg-amber-400"
            )}
          />
          {robotStatus === "operational" ? "Robot Operational" : "Robot Degraded"}
        </Badge>
      </div>

      <div className="flex items-center gap-5">
        <div
          className="hidden items-center gap-1.5 text-ink-400 sm:flex"
          title={`Battery ${battery}%`}
        >
          <BatteryIcon className={cn("h-4 w-4 transition-colors duration-500", batteryColor)} />
          <span className="w-9 font-mono text-[12px] text-ink-200 tabular-nums">
            {battery.toFixed(0)}%
          </span>
        </div>
        <div className="hidden items-center gap-1.5 text-ink-400 sm:flex" title="Signal strength">
          <SignalBars level={signalLevel} />
          <span className="w-14 font-mono text-[12px] text-ink-200 tabular-nums">
            {signalDbm}dBm
          </span>
        </div>
        <div className="hidden items-center gap-1.5 text-ink-400 lg:flex" title="Mesh network">
          {signalLevel <= 1 ? (
            <WifiOff className="h-4 w-4 text-amber-400" />
          ) : (
            <Wifi className="h-4 w-4 text-steel-400" />
          )}
        </div>
        <Separator />
        <div className="text-right">
          <div className="font-mono text-[13px] text-ink-100 tabular-nums">
            {formatClock(now)}
          </div>
          <div className="text-[10px] text-ink-500">UTC+05 &middot; ALMATY</div>
        </div>
      </div>
    </header>
  );
}

function Separator() {
  return <div className="hidden h-8 w-px bg-border sm:block" />;
}
