import { useEffect, useState } from "react";
import { TopNav } from "@/components/layout/TopNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { CameraFeed } from "@/components/panels/CameraFeed";
import { MiniMap } from "@/components/panels/MiniMap";
import { RobotHealth } from "@/components/panels/RobotHealth";
import { MissionStats } from "@/components/panels/MissionStats";
import { MissionLogPanel } from "@/components/panels/MissionLogPanel";
import { CommandBar } from "@/components/panels/CommandBar";
import { Skeleton } from "@/components/ui/skeleton";
import { SimulationProvider } from "@/state/SimulationContext";

export default function App() {
  const [activeSection, setActiveSection] = useState("mission-control");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(id);
  }, []);

  return (
    <SimulationProvider>
      <div className="flex h-screen w-full flex-col overflow-hidden bg-base-950">
        <TopNav />

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <Sidebar active={activeSection} onSelect={setActiveSection} />

          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:overflow-hidden">
            <div className="flex min-h-0 flex-1 flex-col gap-3 p-3">
              <div className="min-h-[360px] flex-[1.4]">
                {loading ? (
                  <Skeleton className="h-full w-full rounded-xl" />
                ) : (
                  <CameraFeed />
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:h-64 lg:shrink-0">
                {loading ? (
                  <>
                    <Skeleton className="h-56 rounded-xl lg:h-full" />
                    <Skeleton className="h-56 rounded-xl lg:h-full" />
                    <Skeleton className="h-56 rounded-xl lg:h-full" />
                  </>
                ) : (
                  <>
                    <MiniMap />
                    <RobotHealth />
                    <MissionStats />
                  </>
                )}
              </div>
            </div>

            <CommandBar />
          </main>

          <MissionLogPanel />
        </div>
      </div>
    </SimulationProvider>
  );
}
