import { useEffect, useState } from "react";

interface TypewriterTextProps {
  text: string;
  onDone?: () => void;
  speed?: number;
  className?: string;
}

export function TypewriterText({ text, onDone, speed = 18, className }: TypewriterTextProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
  }, [text]);

  useEffect(() => {
    if (count >= text.length) {
      onDone?.();
      return;
    }
    const id = setTimeout(() => setCount((c) => c + 1), speed);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, text]);

  const done = count >= text.length;

  return (
    <span className={className}>
      {text.slice(0, count)}
      {!done && (
        <span className="ml-[1px] inline-block h-3 w-[2px] translate-y-[1px] animate-pulse-dot bg-steel-300 align-middle" />
      )}
    </span>
  );
}
