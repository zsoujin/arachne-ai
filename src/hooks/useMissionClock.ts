import { useEffect, useState } from "react";

export function useLiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function useMissionTimer(startSeconds = 0) {
  const [elapsed, setElapsed] = useState(startSeconds);
  useEffect(() => {
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return elapsed;
}
