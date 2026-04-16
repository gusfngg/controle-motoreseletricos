"use client";

import { useEffect, useState } from "react";

function formatCurrentDateTime(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

export function CurrentTimeBadge() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000 * 30);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="min-w-fit rounded-[20px] bg-slate-950 px-3 py-2 text-white">
      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/50">
        Atualizado
      </p>
      <p className="mt-0.5 text-xs font-medium text-white/82">
        {formatCurrentDateTime(now)}
      </p>
    </div>
  );
}
