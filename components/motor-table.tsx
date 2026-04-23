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
  SlidersHorizontal,
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

  if (Number.isNaN(date.getTime())) {
    return "Sem data";
  }

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
    case "descricao":
      return motor.descricao.toLowerCase();
    case "status":
      return motor.status;
    case "localizacao":
      return motor.localizacao.toLowerCase();
    case "potencia_cv":
      return motor.potencia_cv;
    case "updated_at":
      return motor.updated_at;
    default:
      return motor.updated_at;
  }
}

function renderEquipamentos(equipamentos: string[], compact = false) {
  if (equipamentos.length === 0) {
    return <span className="text-slate-300">-</span>;
  }

  const visible = compact ? equipamentos.slice(0, 2) : equipamentos.slice(0, 3);
  const extra = equipamentos.length - visible.length;

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map((equipamento) => (
        <span
          key={equipamento}
          className={cn(
            "rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-medium text-slate-600",
            compact ? "text-[11px]" : "text-xs"
          )}
        >
          {equipamento}
        </span>
      ))}
      {extra > 0 && (
        <span
          className={cn(
            "rounded-full border border-dashed border-slate-300 px-2.5 py-1 font-medium text-slate-500",
            compact ? "text-[11px]" : "text-xs"
          )}
        >
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
        const equipamentosText = motor.equipamentos.join(" ").toLowerCase();

        return (
          motor.descricao.toLowerCase().includes(query) ||
          motor.localizacao.toLowerCase().includes(query) ||
          motor.marca.toLowerCase().includes(query) ||
          motor.numero_serie.toLowerCase().includes(query) ||
          equipamentosText.includes(query)
        );
      });
    }

    if (statusFilter !== "todos") {
      list = list.filter((motor) => motor.status === statusFilter);
    }

    list.sort((a, b) => {
      const aValue = getSortValue(a, sortField);
      const bValue = getSortValue(b, sortField);

      if (aValue < bValue) return sortDir === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [deferredSearch, motors, sortDir, sortField, statusFilter]);

  function renderSortButton(field: SortField, label: string) {
    return (
      <button
        type="button"
        onClick={() => handleSort(field)}
        className="flex items-center gap-1 transition-colors hover:text-black"
      >
        {label}
        <ArrowUpDown
          className={`h-3 w-3 ${sortField === field ? "text-red-600" : "text-gray-400"}`}
        />
      </button>
    );
  }

  function renderStatus(motor: Motor) {
    const badge = (
      <StatusBadge
        status={motor.status}
        className={cn(
          "select-none",
          isMaintenanceStatus(motor.status) &&
            "cursor-pointer ring-1 ring-amber-200 hover:ring-amber-400"
        )}
      />
    );

    if (!isMaintenanceStatus(motor.status)) {
      return badge;
    }

    return (
      <MaintenanceDialog motor={motor}>
        <button type="button" className="rounded-full text-left">
          {badge}
        </button>
      </MaintenanceDialog>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar motor, aplicacao ou local..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-11 rounded-xl border-slate-200 pl-10"
            />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="hidden items-center gap-2 text-sm text-slate-500 sm:flex">
              <SlidersHorizontal className="h-4 w-4" />
              <span>Filtrar status</span>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-11 rounded-xl sm:w-52">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                {(Object.keys(STATUS_LABELS) as MotorStatus[]).map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              {filtered.length} motor{filtered.length !== 1 ? "es" : ""}
            </span>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-300 bg-white px-6 py-14 text-center text-slate-400 shadow-sm">
          <Package className="mx-auto mb-3 h-10 w-10 opacity-35" />
          <p className="text-sm font-medium text-slate-600">
            Nenhum motor encontrado
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {motors.length === 0
              ? "Cadastre o primeiro motor para montar seu estoque e historico."
              : "Tente ajustar os filtros ou a busca."}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filtered.map((motor) => (
              <article
                key={motor.id}
                className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-base font-semibold leading-tight text-slate-950">
                      {motor.descricao}
                    </p>
                    <p className="text-xs text-slate-500">
                      {motor.marca || "Marca nao informada"}
                    </p>
                  </div>
                  <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                    #{motor.id}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {renderStatus(motor)}
                  <StockTagButton id={motor.id} active={motor.em_estoque} compact />
                </div>

                <div className="mt-4 space-y-3">
                  <div className="flex items-start gap-2 text-sm text-slate-600">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    <span>{motor.localizacao || "Localizacao nao informada"}</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <span className="inline-flex items-center gap-1.5">
                      <Gauge className="h-4 w-4 text-slate-400" />
                      {motor.potencia_cv ? `${motor.potencia_cv} CV` : "-"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-slate-400" />
                      {motor.tensao ? `${motor.tensao} V` : "-"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Package className="h-4 w-4 text-slate-400" />
                      {motor.quantidade ?? 1} un.
                    </span>
                  </div>

                  {renderEquipamentos(motor.equipamentos, true)}

                  <p className="text-xs text-slate-400">
                    Atualizado em {formatDateTime(motor.updated_at)}
                  </p>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button asChild variant="outline" className="h-11 flex-1 rounded-xl">
                    <Link href={`/motors/${motor.id}/edit`}>
                      <Pencil className="h-4 w-4" />
                      Editar
                    </Link>
                  </Button>
                  <DeleteMotorButton
                    id={motor.id}
                    descricao={motor.descricao}
                    mode="full"
                  />
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {renderSortButton("descricao", "Motor")}
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {renderSortButton("status", "Status")}
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Estoque
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Qtd
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Aplicacoes
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {renderSortButton("localizacao", "Localizacao")}
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {renderSortButton("potencia_cv", "CV")}
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                      {renderSortButton("updated_at", "Atualizado em")}
                    </th>
                    <th className="px-4 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Acoes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((motor) => (
                    <tr
                      key={motor.id}
                      className="align-top transition-colors hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-950">
                          {motor.descricao}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {motor.marca || "Marca nao informada"}
                        </p>
                      </td>
                      <td className="px-4 py-4">{renderStatus(motor)}</td>
                      <td className="px-4 py-4">
                        <StockTagButton id={motor.id} active={motor.em_estoque} compact />
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-slate-700">
                        {motor.quantidade ?? 1}
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {renderEquipamentos(motor.equipamentos)}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {motor.localizacao || "-"}
                      </td>
                      <td className="px-4 py-4 text-slate-700">
                        {motor.potencia_cv ? `${motor.potencia_cv} CV` : "-"}
                        {motor.tensao ? (
                          <p className="mt-1 text-xs text-slate-400">
                            {motor.tensao} V
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-medium text-slate-700">
                          {formatDateTime(motor.updated_at)}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-gray-400 hover:bg-gray-100 hover:text-black"
                          >
                            <Link href={`/motors/${motor.id}/edit`}>
                              <Pencil className="h-4 w-4" />
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
          </div>
        </>
      )}
    </div>
  );
}
