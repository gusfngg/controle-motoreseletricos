import Link from "next/link";
import { getMotors, getStats } from "@/lib/actions";
import { Motor, MotorStats } from "@/types/motor";
import { MotorTable } from "@/components/motor-table";
import { CurrentTimeBadge } from "@/components/current-time-badge";
import { Button } from "@/components/ui/button";
import { Plus, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [motors, stats] = await Promise.all([getMotors(), getStats()]);
  const s = stats as MotorStats;

  const statCards = [
    { label: "Total", value: s.total, accent: "text-zinc-900" },
    { label: "Disponíveis", value: s.disponiveis, accent: "text-emerald-600" },
    { label: "Em uso", value: s.em_uso, accent: "text-blue-600" },
    { label: "Manutenção", value: s.manutencao, accent: "text-amber-600" },
    { label: "Reparo", value: s.reparo, accent: "text-red-600" },
    { label: "Estoque", value: s.estoque, accent: "text-zinc-700" },
    { label: "Sucateados", value: s.sucateado, accent: "text-zinc-400" },
  ];

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white shadow-sm">
        <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-zinc-950">
              <Zap className="h-3.5 w-3.5 text-red-400" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-zinc-950">
              Motores Elétricos
            </span>
          </div>

          <div className="flex items-center gap-3">
            <CurrentTimeBadge />
            <Button
              asChild
              size="sm"
              className="h-8 gap-1.5 rounded-lg bg-zinc-950 px-3 text-xs font-medium text-white hover:bg-zinc-800"
            >
              <Link href="/motors/new">
                <Plus className="h-3.5 w-3.5" />
                Novo motor
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-screen-xl px-5 py-8 sm:px-8">
        <div className="mb-8 grid grid-cols-4 gap-px overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-200 shadow-sm sm:grid-cols-7">
          {statCards.map((card) => (
            <div key={card.label} className="bg-white px-4 py-4 sm:py-5">
              <p className={`text-2xl font-bold tabular-nums ${card.accent}`}>
                {card.value}
              </p>
              <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                {card.label}
              </p>
            </div>
          ))}
        </div>

        {(s.manutencao > 0 || s.reparo > 0) && (
          <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
            <span>
              <span className="font-semibold">
                {s.manutencao + s.reparo} motor{s.manutencao + s.reparo !== 1 ? "es" : ""}
              </span>{" "}
              em manutenção ou reparo. Toque no status para ver detalhes.
            </span>
          </div>
        )}

        <MotorTable motors={motors as unknown as Motor[]} />
      </main>

      <footer className="mt-16 border-t border-zinc-100 py-6 text-center text-xs text-zinc-400">
        MotorControl — gestão de motores elétricos
      </footer>
    </div>
  );
}
