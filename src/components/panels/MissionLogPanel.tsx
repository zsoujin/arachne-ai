import type { ElementType } from "react";
import {
  Brain,
  Flame,
  Navigation2,
  Cpu,
  TriangleAlert,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSimulation } from "@/state/SimulationContext";
import { TypewriterText } from "@/components/ui/typewriter-text";
import type { LogEntry } from "@/types";

const typeMeta: Record<
  LogEntry["type"],
  { icon: ElementType; color: string; label: string }
> = {
  reasoning: { icon: Brain, color: "text-steel-400", label: "REASONING" },
  detection: { icon: Flame, color: "text-amber-400", label: "DETECTION" },
  navigation: { icon: Navigation2, color: "text-ink-300", label: "NAV" },
  system: { icon: Cpu, color: "text-ink-500", label: "SYSTEM" },
  alert: { icon: TriangleAlert, color: "text-rose-500", label: "ALERT" },
};

export function MissionLogPanel() {
  const { missionLog, aiThinking, newEntryId, revealedIds, markRevealed } = useSimulation();

  return (
    <aside className="flex w-full shrink-0 flex-col border-border bg-base-900/50 lg:h-full lg:w-[360px] lg:border-l">
      <div className="flex items-center justify-between border-b border-border px-4 py-3.5">
        <div className="flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-ink-400" />
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.11em] text-ink-400">
            Mission Log &middot; AI Reasoning
          </h2>
        </div>
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-moss-400">
          <span className="h-1.5 w-1.5 rounded-full bg-moss-400 animate-pulse-dot" />
          LIVE
        </span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3">
        {aiThinking && (
          <div className="mb-1 flex items-center gap-3 rounded-lg bg-steel-900/25 px-2.5 py-2.5 animate-fade-in">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-steel-700/50 bg-base-850 text-steel-400">
              <Brain className="h-3.5 w-3.5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[11px] text-steel-400">AI analyzing</span>
              <span className="flex gap-0.5">
                <span className="h-1 w-1 rounded-full bg-steel-400 animate-pulse-dot [animation-delay:0ms]" />
                <span className="h-1 w-1 rounded-full bg-steel-400 animate-pulse-dot [animation-delay:150ms]" />
                <span className="h-1 w-1 rounded-full bg-steel-400 animate-pulse-dot [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1">
          {missionLog.map((entry, i) => {
            const meta = typeMeta[entry.type];
            const Icon = meta.icon;
            const isNew = entry.id === newEntryId && !revealedIds.has(entry.id);
            return (
              <div
                key={entry.id}
                className={cn(
                  "group relative flex gap-3 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-base-800/60 animate-fade-in",
                  i === 0 && "bg-steel-900/25"
                )}
              >
                <div className="flex flex-col items-center pt-0.5">
                  <div
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border bg-base-850",
                      meta.color
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  {i !== missionLog.length - 1 && (
                    <div className="mt-1 w-px flex-1 bg-border" />
                  )}
                </div>
                <div className="flex-1 pb-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("font-mono text-[10px] tracking-wide", meta.color)}>
                      {meta.label}
                    </span>
                    <span className="font-mono text-[10px] text-ink-600">{entry.timestamp}</span>
                  </div>
                  <p className="mt-0.5 text-[12.5px] leading-snug text-ink-200">
                    {isNew ? (
                      <TypewriterText
                        text={entry.message}
                        onDone={() => markRevealed(entry.id)}
                      />
                    ) : (
                      entry.message
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
