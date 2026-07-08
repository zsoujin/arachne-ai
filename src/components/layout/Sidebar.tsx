import type { ElementType } from "react";
import {
  Compass,
  ListChecks,
  Radar,
  Users,
  TriangleAlert,
  History,
  Settings,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { missionQueue, hazards, missionHistory } from "@/data/mockData";
import { useSimulation } from "@/state/SimulationContext";
import { SafetyPanel } from "@/components/panels/SafetyPanel";

const NAV: { id: string; label: string; icon: ElementType }[] = [
  { id: "mission-control", label: "Mission Control", icon: Radar },
  { id: "mission-queue", label: "Mission Queue", icon: ListChecks },
  { id: "navigation", label: "Navigation", icon: Compass },
  { id: "survivors", label: "Detected Survivors", icon: Users },
  { id: "hazards", label: "Detected Hazards", icon: TriangleAlert },
  { id: "history", label: "Mission History", icon: History },
  { id: "settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  active: string;
  onSelect: (id: string) => void;
}

export function Sidebar({ active, onSelect }: SidebarProps) {
  const { survivorConfirmed, hazardsVisible } = useSimulation();

  const counts: Record<string, number> = {
    "mission-queue": missionQueue.length,
    survivors: survivorConfirmed ? 1 : 0,
    hazards: hazardsVisible.length,
  };

  return (
    <aside className="flex w-full shrink-0 flex-col border-border bg-base-900/50 lg:h-full lg:w-64 lg:border-r">
      <nav className="flex flex-col gap-0.5 p-2.5">
        {NAV.map((item) => {
          const isActive = active === item.id;
          const Icon = item.icon;
          const count = counts[item.id];
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={cn(
                "group flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition-colors",
                isActive
                  ? "bg-steel-900/60 text-ink-100"
                  : "text-ink-400 hover:bg-base-800 hover:text-ink-200"
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4 shrink-0",
                  isActive ? "text-steel-400" : "text-ink-500 group-hover:text-ink-300"
                )}
              />
              <span className="flex-1 font-medium">{item.label}</span>
              {typeof count === "number" && (
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.5 font-mono text-[10px] transition-colors duration-300",
                    isActive
                      ? "bg-steel-700/40 text-steel-300"
                      : "bg-base-800 text-ink-500"
                  )}
                >
                  {count}
                </span>
              )}
              {isActive && <ChevronRight className="h-3.5 w-3.5 text-steel-500" />}
            </button>
          );
        })}
      </nav>

      <div className="mx-2.5 my-1 h-px bg-border" />

      <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
        <SidebarContext active={active} />
      </div>
    </aside>
  );
}

function SidebarContext({ active }: { active: string }) {
  const { survivorConfirmed, hazardsVisible, missionStatus, primaryDetection } = useSimulation();
  const visibleHazards = hazards.filter((h) => hazardsVisible.includes(h.id));

  switch (active) {
    case "mission-queue":
      return (
        <div className="flex flex-col gap-2 animate-fade-in">
          <p className="px-0.5 text-[10px] font-semibold uppercase tracking-widest text-ink-500">
            Queue &middot; {missionQueue.length} tasks
          </p>
          {missionQueue.map((q) => (
            <div key={q.id} className="rounded-lg border border-border bg-base-850/60 p-2.5">
              <p className="text-[12.5px] leading-snug text-ink-200">{q.title}</p>
              <div className="mt-1.5 flex items-center justify-between">
                <Badge
                  variant={
                    q.status === "in-progress"
                      ? "active"
                      : q.status === "complete"
                        ? "success"
                        : "neutral"
                  }
                >
                  {q.status}
                </Badge>
                {q.eta && <span className="font-mono text-[10px] text-ink-500">ETA {q.eta}</span>}
              </div>
            </div>
          ))}
        </div>
      );
    case "survivors":
      return (
        <div className="flex flex-col gap-2 animate-fade-in">
          <p className="px-0.5 text-[10px] font-semibold uppercase tracking-widest text-ink-500">
            Detected &middot; {survivorConfirmed ? 1 : 0}
          </p>
          {survivorConfirmed ? (
            <div className="rounded-lg border border-moss-500/30 bg-base-850/60 p-2.5 animate-fade-in">
              <div className="flex items-center justify-between">
                <p className="text-[12.5px] font-medium text-ink-200">Confirmed Survivor</p>
                <span className="font-mono text-[11px] text-moss-400">
                  {primaryDetection?.confidence ?? 96}%
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-ink-500">Sector B &middot; Grid B-7</p>
              <p className="mt-1.5 text-[10.5px] text-amber-300">Operator verification recommended</p>
            </div>
          ) : (
            <p className="text-[12px] leading-relaxed text-ink-500">
              No survivors confirmed yet. Detections will appear here once combined
              confidence clears the verification threshold.
            </p>
          )}
        </div>
      );
    case "hazards":
      return (
        <div className="flex flex-col gap-2 animate-fade-in">
          <p className="px-0.5 text-[10px] font-semibold uppercase tracking-widest text-ink-500">
            Hazard Zones &middot; {visibleHazards.length}
          </p>
          {visibleHazards.length === 0 && (
            <p className="text-[12px] leading-relaxed text-ink-500">
              No hazards mapped yet in this mission.
            </p>
          )}
          {visibleHazards.map((h) => (
            <div key={h.id} className="rounded-lg border border-border bg-base-850/60 p-2.5 animate-fade-in">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[12.5px] text-ink-200">{h.label}</p>
                <Badge
                  variant={h.severity === "high" ? "danger" : h.severity === "medium" ? "warning" : "neutral"}
                >
                  {h.severity}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      );
    case "history":
      return (
        <div className="flex flex-col gap-2 animate-fade-in">
          <p className="px-0.5 text-[10px] font-semibold uppercase tracking-widest text-ink-500">
            Recent Missions
          </p>
          {missionHistory.map((h) => (
            <div key={h.id} className="rounded-lg border border-border bg-base-850/60 p-2.5">
              <p className="text-[12.5px] font-medium text-ink-200">{h.name}</p>
              <div className="mt-1 flex items-center justify-between text-[11px] text-ink-500">
                <span>{h.date}</span>
                <span className="font-mono">{h.duration}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-[11px] text-ink-400">{h.survivorsFound} survivors found</span>
                <Badge
                  variant={
                    h.outcome === "success" ? "success" : h.outcome === "partial" ? "warning" : "danger"
                  }
                >
                  {h.outcome}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      );
    case "settings":
      return (
        <div className="flex flex-col gap-3 animate-fade-in text-[12.5px] text-ink-300">
          {[
            "Autonomous engagement threshold",
            "Thermal overlay sensitivity",
            "Voice command confirmation",
            "Telemetry upload interval",
          ].map((label) => (
            <div key={label} className="flex items-center justify-between rounded-lg border border-border bg-base-850/60 px-3 py-2.5">
              <span>{label}</span>
              <div className="h-5 w-9 rounded-full bg-steel-700/50 p-0.5">
                <div className="h-4 w-4 rounded-full bg-steel-300" />
              </div>
            </div>
          ))}
        </div>
      );
    case "navigation":
      return (
        <div className="flex flex-col gap-2 text-[12.5px] text-ink-300 animate-fade-in">
          <div className="rounded-lg border border-border bg-base-850/60 p-3">
            <p className="text-ink-500 text-[11px] uppercase tracking-widest mb-1">Heading</p>
            <p className="font-mono text-lg text-ink-100">312&deg; NW</p>
          </div>
          <div className="rounded-lg border border-border bg-base-850/60 p-3">
            <p className="text-ink-500 text-[11px] uppercase tracking-widest mb-1">Speed</p>
            <p className="font-mono text-lg text-ink-100">
              {missionStatus === "standby" || missionStatus === "complete" ? "0.00 m/s" : "0.62 m/s"}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-base-850/60 p-3">
            <p className="text-ink-500 text-[11px] uppercase tracking-widest mb-1">Terrain</p>
            <p className="text-ink-200">Rubble, mixed debris field</p>
          </div>
        </div>
      );
    default:
      return (
        <div className="flex flex-col gap-3 text-[12.5px] text-ink-400 animate-fade-in">
          <p className="leading-relaxed">
            Unit-07 is autonomously executing the active mission plan. AI reasoning and
            detections stream in the panel on the right.
          </p>
          <div className="rounded-lg border border-border bg-base-850/60 p-3">
            <p className="text-ink-500 text-[11px] uppercase tracking-widest mb-1">Current Objective</p>
            <p className="text-ink-200">Search Sector B, prioritize thermal signatures</p>
          </div>
          <SafetyPanel />
        </div>
      );
  }
}
