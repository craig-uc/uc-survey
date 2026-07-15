"use client";

import { useEffect, useRef, useState } from "react";
import GlassPanel from "@/components/GlassPanel";

interface PreStartStepProps {
  startAt: string | null;
  onExpire: () => void;
}

function remainingMs(startAt: string): number {
  return new Date(startAt).getTime() - Date.now();
}

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

export default function PreStartStep({ startAt, onExpire }: PreStartStepProps) {
  const [remaining, setRemaining] = useState(() => (startAt ? remainingMs(startAt) : null));
  const hasExpired = useRef(false);

  useEffect(() => {
    if (!startAt) return;
    hasExpired.current = false;

    const tick = () => {
      const ms = remainingMs(startAt);
      setRemaining(ms);
      if (ms <= 0 && !hasExpired.current) {
        hasExpired.current = true;
        onExpire();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startAt]);

  return (
    <GlassPanel>
      <div className="flex flex-col items-center justify-center min-h-full gap-4 text-center">
        <h1 className="text-3xl font-bold">This survey hasn&apos;t started yet</h1>
        <p>{remaining === null ? "Check back soon." : `Starts in: ${formatRemaining(remaining)}`}</p>
      </div>
    </GlassPanel>
  );
}
