import { ShieldCheck, ShieldAlert, Eye, RadioTower, Octagon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSimulation } from "@/state/SimulationContext";

export function SafetyPanel() {
  const { commsStable, lowVisibility, sensorOcclusion, humanApprovalRequired, emergencyStopAvailable } =
    useSimulation();

  const rows = [
    {
      label: "Human approval required",
      active: humanApprovalRequired,
      icon: ShieldAlert,
      activeText: "Awaiting operator review",
      idleText: "Not required",
      tone: "warning" as const,
    },
    {
      label: "Low visibility detected",
      active: lowVisibility,
      icon: Eye,
      activeText: "Sensor confidence reduced",
      idleText: "Clear",
      tone: "warning" as const,
    },
    {
      label: "Possible sensor occlusion",
      active: sensorOcclusion,
      icon: Eye,
      activeText: "Partial obstruction",
      idleText: "None detected",
      tone: "warning" as const,
    },
    {
      label: "Communication stable",
      active: commsStable,
      icon: RadioTower,
      activeText: "Mesh link nominal",
      idleText: "Link degraded",
      tone: "success" as const,
    },
    {
      label: "Emergency stop available",
      active: emergencyStopAvailable,
      icon: Octagon,
      activeText: "Ready",
      idleText: "Unavailable",
      tone: "success" as const,
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-1.5 px-0.5 text-[10px] font-semibold uppercase tracking-widest text-ink-500">
        <ShieldCheck className="h-3 w-3" /> Safety
      </p>
      {rows.map((row) => {
        const Icon = row.icon;
        const isGood = row.tone === "success" ? row.active : !row.active;
        return (
          <div
            key={row.label}
            className="flex items-center justify-between gap-2 rounded-lg border border-border bg-base-850/60 px-3 py-2 transition-colors duration-500"
          >
            <div className="flex items-center gap-2">
              <Icon
                className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  isGood ? "text-moss-400" : "text-amber-400"
                )}
              />
              <span className="text-[12px] text-ink-300">{row.label}</span>
            </div>
            <span
              className={cn(
                "shrink-0 font-mono text-[10px] transition-colors duration-500",
                isGood ? "text-moss-400" : "text-amber-400"
              )}
            >
              {row.active ? row.activeText : row.idleText}
            </span>
          </div>
        );
      })}
    </div>
  );
}
