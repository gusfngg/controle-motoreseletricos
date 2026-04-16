"use client";

import { useState, useTransition } from "react";
import { Archive, LoaderCircle } from "lucide-react";
import { toggleMotorStock } from "@/lib/actions";
import { cn } from "@/lib/utils";

interface StockTagButtonProps {
  id: number;
  active: boolean;
  compact?: boolean;
}

export function StockTagButton({
  id,
  active,
  compact = false,
}: StockTagButtonProps) {
  const [isActive, setIsActive] = useState(active);
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      const nextValue = !isActive;
      const result = await toggleMotorStock(id, nextValue);

      if (!result?.error) {
        setIsActive(nextValue);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
        isActive
          ? "border-slate-900 bg-slate-900 text-white"
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
        compact && "px-2.5 py-1 text-[11px]"
      )}
    >
      {isPending ? (
        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Archive className="h-3.5 w-3.5" />
      )}
      {isActive ? "Estoque" : compact ? "+ Estoque" : "Marcar estoque"}
    </button>
  );
}
