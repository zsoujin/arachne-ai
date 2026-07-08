import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Map } from "lucide-react";
import { hazards } from "@/data/mockData";
import { useSimulation } from "@/state/SimulationContext";

export function MiniMap() {
  const { robotPos, trail, hazardsVisible, survivorConfirmed, survivorLocation } = useSimulation();

  const trailD = trail.length > 1
    ? trail.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ")
    : "";
  const visibleHazards = hazards.filter((h) => hazardsVisible.includes(h.id));

  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <Map className="h-3.5 w-3.5" /> Sector Map
        </CardTitle>
        <span className="font-mono text-[10px] text-ink-500">SECTOR B</span>
      </CardHeader>
      <CardContent className="flex-1 pb-3">
        <div className="relative h-full min-h-[160px] w-full overflow-hidden rounded-lg border border-border bg-base-950">
          <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none">
            {/* grid */}
            {Array.from({ length: 9 }).map((_, i) => (
              <line key={`v${i}`} x1={(i + 1) * 10} y1={0} x2={(i + 1) * 10} y2={100} stroke="#1c2026" strokeWidth="0.3" />
            ))}
            {Array.from({ length: 9 }).map((_, i) => (
              <line key={`h${i}`} x1={0} y1={(i + 1) * 10} x2={100} y2={(i + 1) * 10} stroke="#1c2026" strokeWidth="0.3" />
            ))}

            {/* hazard zones, revealed progressively */}
            {visibleHazards.map((h) => (
              <circle
                key={h.id}
                cx={h.x}
                cy={h.y}
                r={h.radius}
                className="animate-fade-in"
                fill={h.severity === "high" ? "#c1454a22" : "#d1963f1f"}
                stroke={h.severity === "high" ? "#e0555b" : "#e0ac5f"}
                strokeWidth="0.5"
                strokeDasharray="1.5 1"
              />
            ))}

            {/* explored path, grows as the robot moves */}
            {trailD && (
              <path d={trailD} fill="none" stroke="#6f97cd" strokeWidth="1" opacity="0.65" />
            )}

            {/* survivor marker, appears only once confirmed */}
            {survivorConfirmed && (
              <g className="animate-fade-in">
                <circle cx={survivorLocation.x} cy={survivorLocation.y} r="4" fill="none" stroke="#6cb794" strokeWidth="0.5" opacity="0.6" className="animate-ping" />
                <circle cx={survivorLocation.x} cy={survivorLocation.y} r="2.6" fill="#4e9c7833" stroke="#6cb794" strokeWidth="0.6" />
                <circle cx={survivorLocation.x} cy={survivorLocation.y} r="0.9" fill="#6cb794" />
              </g>
            )}

            {/* robot position, live */}
            <g transform={`translate(${robotPos.x},${robotPos.y})`}>
              <circle r="4.2" fill="none" stroke="#6f97cd" strokeWidth="0.5" opacity="0.5" className="animate-ping" />
              <circle r="3.2" fill="#4576b822" stroke="#6f97cd" strokeWidth="0.6" />
              <circle r="1.1" fill="#9dbadf" />
            </g>
          </svg>

          <div className="absolute bottom-2 left-2 flex items-center gap-3 rounded bg-base-950/80 px-2 py-1 backdrop-blur-sm">
            <Legend color="#9dbadf" label="Unit" />
            <Legend color="#6cb794" label="Survivor" />
            <Legend color="#e0555b" label="Hazard" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      <span className="font-mono text-[9px] text-ink-400">{label}</span>
    </div>
  );
}
