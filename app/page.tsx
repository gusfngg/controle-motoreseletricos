import Link from "next/link";
import { getMotors, getStats } from "@/lib/actions";
import { Motor, MotorStats } from "@/types/motor";
import { MotorTable } from "@/components/motor-table";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  Package,
  Plus,
  Settings,
  Wrench,
  Zap,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [motors, stats] = await Promise.all([getMotors(), getStats()]);
  const dashboardStats = stats as MotorStats;

  const statCards = [
    {
      label: "Total",
      value: dashboardStats.total,
      icon: Package,
      color: "text-gray-700",
      bg: "bg-gray-100",
      border: "border-gray-200",
    },
    {
      label: "Disponiveis",
      value: dashboardStats.disponiveis,
      icon: CheckCircle2,
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    },
    {
      label: "Em uso",
      value: dashboardStats.em_uso,
      icon: Zap,
      color: "text-blue-700",
      bg: "bg-blue-50",
      border: "border-blue-200",
    },
    {
      label: "Manutencao",
      value: dashboardStats.manutencao,
      icon: Settings,
      color: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
    },
    {
      label: "Em reparo",
      value: dashboardStats.reparo,
      icon: Wrench,
      color: "text-red-700",
      bg: "bg-red-50",
      border: "border-red-200",
    },
    {
      label: "Estoque",
      value: dashboardStats.estoque,
      icon: Archive,
      color: "text-slate-700",
      bg: "bg-slate-100",
      border: "border-slate-200",
    },
    {
      label: "Sucateados",
      value: dashboardStats.sucateado,
      icon: AlertTriangle,
      color: "text-gray-500",
      bg: "bg-gray-100",
      border: "border-gray-200",
    },
  ];

  const alertMotors = (motors as unknown as Motor[]).filter(
    (motor) => motor.status === "reparo" || motor.status === "manutencao"
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f1f5f9_100%)]">
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/85 backdrop-blur-md">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 py-4 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:py-0">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded bg-black">
                <Zap className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <span className="tracking-tight text-sm font-bold text-black">
                  CONTROLE - <span className="text-red-600"> MOTORES ELÉTRICOS</span>
                </span>
                <p className="hidden text-xs leading-none text-gray-400 sm:block">
                  Gestao de motores eletricos
                </p>
              </div>
            </div>
            <Button
              asChild
              size="sm"
              className="hidden h-11 w-full gap-2 rounded-xl sm:inline-flex sm:w-auto"
            >
              <Link href="/motors/new">
                <Plus className="h-4 w-4" />
                <span>Novo motor</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-screen-xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <div className="min-w-fit rounded-[20px] bg-slate-950 px-3 py-2 text-white">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/50">
                Atualizado
              </p>
              <p className="mt-0.5 text-xs font-medium text-white/82">
                {new Intl.DateTimeFormat("pt-BR", {
                  dateStyle: "short",
                  timeStyle: "short",
                }).format(new Date())}
              </p>
            </div>
            {statCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.label}
                  className={`min-w-fit rounded-[20px] border ${card.border} bg-white px-3 py-2`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`rounded-full p-1.5 ${card.bg}`}>
                      <Icon className={`h-3.5 w-3.5 ${card.color}`} />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-slate-500">
                        {card.label}
                      </p>
                      <p className={`text-sm font-bold ${card.color}`}>
                        {String(card.value)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {alertMotors.length > 0 && (
          <div className="flex items-start gap-3 rounded-[20px] border border-red-200 bg-red-50 px-4 py-3 shadow-sm">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <div className="text-sm">
              <span className="font-semibold text-red-800">Atencao: </span>
              <span className="text-red-700">
                {alertMotors.length} motor{alertMotors.length > 1 ? "es" : ""} em
                reparo ou manutencao.
              </span>
            </div>
          </div>
        )}

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-700">
              Inventario de motores
            </h2>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-9 rounded-full border-slate-200 px-3 text-slate-600 shadow-none hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 sm:hidden"
            >
              <Link href="/motors/new">
                <Plus className="h-3.5 w-3.5" />
                <span>Novo</span>
              </Link>
            </Button>
          </div>
          <MotorTable motors={motors as unknown as Motor[]} />
        </div>
      </main>

      <footer className="mt-12 border-t border-white/80 bg-white/70 py-4 text-center text-xs text-gray-400 backdrop-blur">
        MotorControl - Sistema de gestao de motores eletricos
      </footer>
    </div>
  );
}
