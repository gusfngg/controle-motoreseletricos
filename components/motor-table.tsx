"use client";

import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpDown,
  Gauge,
  MapPin,
  Package,
  Pencil,
  Search,
  Zap,
} from "lucide-react";
import { DeleteMotorButton } from "@/components/delete-motor-button";
import { MaintenanceDialog } from "@/components/maintenance-dialog";
import { StatusBadge } from "@/components/status-badge";
import { StockTagButton } from "@/components/stock-tag-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Motor, MotorStatus, STATUS_LABELS } from "@/types/motor";

interface MotorTableProps {
  motors: Motor[];
}

type SortField =
  | "descricao"
  | "status"
  | "localizacao"
  | "potencia_cv"
  | "updated_at";
type SortDir = "asc" | "desc";

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function isMaintenanceStatus(status: MotorStatus) {
  return status === "manutencao" || status === "reparo";
}

function getSortValue(motor: Motor, field: SortField) {
  switch (field) {
    case "descricao": return motor.descricao.toLowerCase();
    case "status": return motor.status;
    case "localizacao": return motor.localizacao.toLowerCase();
    case "potencia_cv": return motor.potencia_cv;
    case "updated_at": return motor.updated_at;
    default: return motor.updated_at;
  }
}

function renderEquipamentos(equipamentos: string[], compact = false) {
  if (equipamentos.length === 0) return <span className="text-zinc-300">—</span>;

  const visible = compact ? equipamentos.slice(0, 2) : equipamentos.slice(0, 3);
  const extra = equipamentos.length - visible.length;

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((eq) => (
        <span
          key={eq}
          className={cn(
            "rounded-md bg-zinc-50 px-2 py-0.5 font-medium text-zinc-600 ring-1 ring-zinc-200",
            compact ? "text-[11px]" : "text-xs"
          )}
        >
          {eq}
        </span>
      ))}
      {extra > 0 && (
        <span className={cn("rounded-md px-2 py-0.5 font-medium text-zinc-400 ring-1 ring-dashed ring-zinc-200", compact ? "text-[11px]" : "text-xs")}>
          +{extra}
        </span>
      )}
    </div>
  );
}

export function MotorTable({ motors }: MotorTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [sortField, setSortField] = useState<SortField>("updated_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const deferredSearch = useDeferredValue(search);

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
      return;
    }
    setSortField(field);
    setSortDir("asc");
  }

  const filtered = useMemo(() => {
    let list = [...motors];

    if (deferredSearch.trim()) {
      const query = deferredSearch.toLowerCase();
      list = list.filter((motor) => {
        const eqText = motor.equipamentos.join(" ").toLowerCase();
        return (
          motor.descricao.toLowerCase().includes(query) ||
          motor.localizacao.toLowerCase().includes(query) ||
          motor.marca.toLowerCase().includes(query) ||
          motor.numero_serie.toLowerCase().includes(query) ||
          eqText.includes(query)
        );
      });
    }

    if (statusFilter !== "todos") {
      list = list.filter((m) => m.status === statusFilter);
    }

    list.sort((a, b) => {
      const av = getSortValue(a, sortField);
      const bv = getSortValue(b, sortField);
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [deferredSearch, motors, sortDir, sortField, statusFilter]);

  function renderSortButton(field: SortField, label: string) {
    const active = sortField === field;
    return (
      <button
        type="button"
        onClick={() => handleSort(field)}
        className={cn(
          "flex items-center gap-1 transition-colors hover:text-zinc-900",
          active ? "text-zinc-900" : "text-zinc-400"
        )}
      >
        {label}
        <ArrowUpDown className={cn("h-3 w-3", active ? "text-red-500" : "text-zinc-300")} />
      </button>
    );
  }

  function renderStatus(motor: Motor) {
    const badge = (
      <StatusBadge
        status={motor.status}
        className={cn(
          "select-none",
          isMaintenanceStatus(motor.status) && "cursor-pointer hover:opacity-80"
        )}
      />
    );

    if (!isMaintenanceStatus(motor.status)) return badge;

    return (
      <MaintenanceDialog motor={motor}>
        <button type="button" className="rounded-full text-left">
          {badge}
        </button>
      </MaintenanceDialog>
    );
  }

  return (
    <div className="space-y-3">
      {/* Search + filter bar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <Input
            placeholder="Buscar motor, local, aplicação..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 rounded-lg border-zinc-300 bg-white pl-9 text-sm placeholder:text-zinc-400 focus-visible:ring-zinc-400"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-auto min-w-40 rounded-lg border-zinc-300 bg-white text-sm">
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {(Object.keys(STATUS_LABELS) as MotorStatus[]).map((s) => (
                <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-zinc-400">
            {filtered.length} motor{filtered.length !== 1 ? "es" : ""}
          </span>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 px-6 py-16 text-center">
          <Package className="mx-auto mb-3 h-8 w-8 text-zinc-200" />
          <p className="text-sm font-medium text-zinc-600">Nenhum motor encontrado</p>
          <p className="mt-1 text-xs text-zinc-400">
            {motors.length === 0
              ? "Cadastre o primeiro motor para começar."
              : "Tente ajustar os filtros ou a busca."}
          </p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-2 md:hidden">
            {filtered.map((motor) => (
              <article
                key={motor.id}
                className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold leading-tight text-zinc-900">
                      {motor.descricao}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {motor.marca || "Marca não informada"}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-md bg-zinc-50 px-2 py-0.5 text-[11px] font-medium text-zinc-400 ring-1 ring-zinc-200">
                    #{motor.id}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {renderStatus(motor)}
                  <StockTagButton id={motor.id} active={motor.em_estoque} compact />
                </div>

                <div className="mt-3 space-y-2 text-sm text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-300" />
                    <span>{motor.localizacao || "Localização não informada"}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center gap-1.5">
                      <Gauge className="h-3.5 w-3.5 text-zinc-300" />
                      {motor.potencia_cv ? `${motor.potencia_cv} CV` : "—"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-zinc-300" />
                      {motor.tensao ? `${motor.tensao} V` : "—"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Package className="h-3.5 w-3.5 text-zinc-300" />
                      {motor.quantidade ?? 1} un.
                    </span>
                  </div>
                  {renderEquipamentos(motor.equipamentos, true)}
                  <p className="text-xs text-zinc-300">{formatDateTime(motor.updated_at)}</p>
                </div>

                <div className="mt-3 flex gap-2">
                  <Button asChild variant="outline" className="h-9 flex-1 rounded-lg border-zinc-200 text-xs">
                    <Link href={`/motors/${motor.id}/edit`}>
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </Link>
                  </Button>
                  <DeleteMotorButton id={motor.id} descricao={motor.descricao} mode="full" />
                </div>
              </article>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-100">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">
                    {renderSortButton("descricao", "Motor")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">
                    {renderSortButton("status", "Status")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">Estoque</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">Qtd</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">Aplicações</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">
                    {renderSortButton("localizacao", "Localização")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">
                    {renderSortButton("potencia_cv", "Dados técnicos")}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">
                    {renderSortButton("updated_at", "Atualizado")}
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filtered.map((motor) => (
                  <tr
                    key={motor.id}
                    className="group align-middle transition-colors hover:bg-zinc-50"
                  >
                    <td className="px-4 py-3.5">
                      <p className="font-medium text-zinc-900">{motor.descricao}</p>
                      <p className="mt-0.5 text-xs text-zinc-400">
                        {motor.marca || "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">{renderStatus(motor)}</td>
                    <td className="px-4 py-3.5">
                      <StockTagButton id={motor.id} active={motor.em_estoque} compact />
                    </td>
                    <td className="px-4 py-3.5 text-sm font-semibold text-zinc-700">
                      {motor.quantidade ?? 1}
                    </td>
                    <td className="px-4 py-3.5">{renderEquipamentos(motor.equipamentos)}</td>
                    <td className="px-4 py-3.5 text-sm text-zinc-500">
                      {motor.localizacao || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-zinc-700">
                      {motor.potencia_cv ? `${motor.potencia_cv} CV` : "—"}
                      {motor.tensao ? (
                        <p className="mt-0.5 text-xs text-zinc-400">{motor.tensao} V</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-zinc-400">
                      {formatDateTime(motor.updated_at)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900"
                        >
                          <Link href={`/motors/${motor.id}/edit`}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                        <DeleteMotorButton id={motor.id} descricao={motor.descricao} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
