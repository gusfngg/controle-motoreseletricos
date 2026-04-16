import { MotorStatus, STATUS_COLORS, STATUS_LABELS } from "@/types/motor";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: MotorStatus;
  className?: string;
}

const STATUS_DOTS: Record<MotorStatus, string> = {
  disponivel: "bg-emerald-500",
  em_uso: "bg-blue-500",
  manutencao: "bg-amber-500",
  reparo: "bg-red-500",
  sucateado: "bg-gray-400",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        STATUS_COLORS[status],
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOTS[status])} />
      {STATUS_LABELS[status]}
    </span>
  );
}
