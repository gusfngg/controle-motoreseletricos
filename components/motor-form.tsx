"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Archive, Save } from "lucide-react";
import { createMotor, updateMotor } from "@/lib/actions";
import { Motor, MotorFormData, MotorStatus } from "@/types/motor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface MotorFormProps {
  motor?: Motor;
}

const STATUS_OPTIONS: { value: MotorStatus; label: string }[] = [
  { value: "disponivel", label: "Disponivel" },
  { value: "em_uso", label: "Em uso" },
  { value: "manutencao", label: "Manutencao" },
  { value: "reparo", label: "Em reparo" },
  { value: "sucateado", label: "Sucateado" },
];

const TENSAO_OPTIONS = [
  "220",
  "380",
  "440",
  "460",
  "500",
  "690",
  "2300",
  "4160",
  "6600",
  "13800",
];

const IP_OPTIONS = ["IP21", "IP44", "IP54", "IP55", "IP65", "IP66", "TEFC"];

function parseEquipamentos(rawValue: FormDataEntryValue | null) {
  return String(rawValue ?? "")
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);
}

export function MotorForm({ motor }: MotorFormProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<MotorStatus>(
    motor?.status ?? "disponivel"
  );
  const [tensao, setTensao] = useState(
    motor?.tensao ? String(motor.tensao) : "380"
  );
  const [ipProtecao, setIpProtecao] = useState(motor?.ip_protecao ?? "IP55");

  async function handleSubmit(formData: FormData) {
    setError(null);

    const data: MotorFormData = {
      descricao: String(formData.get("descricao") ?? ""),
      marca: String(formData.get("marca") ?? ""),
      numero_serie: String(formData.get("numero_serie") ?? ""),
      potencia_cv: parseFloat(String(formData.get("potencia_cv") ?? "")) || 0,
      tensao: parseFloat(tensao) || 0,
      corrente: parseFloat(String(formData.get("corrente") ?? "")) || 0,
      rpm: parseInt(String(formData.get("rpm") ?? ""), 10) || 0,
      carcaca: String(formData.get("carcaca") ?? ""),
      ip_protecao: ipProtecao,
      status,
      em_estoque: formData.get("em_estoque") === "on",
      quantidade: Math.max(1, parseInt(String(formData.get("quantidade") ?? "1"), 10) || 1),
      equipamentos: parseEquipamentos(formData.get("equipamentos")),
      localizacao: String(formData.get("localizacao") ?? ""),
      observacoes: String(formData.get("observacoes") ?? ""),
    };

    startTransition(async () => {
      try {
        if (motor) {
          await updateMotor(motor.id, data);
        } else {
          await createMotor(data);
        }
      } catch (caughtError) {
        if (
          caughtError instanceof Error &&
          !caughtError.message.includes("NEXT_REDIRECT")
        ) {
          setError("Nao foi possivel salvar o motor.");
        }
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6 pb-10">
      <div className="space-y-4 rounded-[24px] bg-slate-950 p-5 text-white shadow-lg shadow-slate-300/40 sm:p-6">
        <div className="flex items-start gap-3">
          <Link href="/">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-10 w-10 rounded-full bg-white/12 text-white hover:bg-white/20 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/60">
              Cadastro de motor
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {motor ? `Editar ${motor.descricao}` : "Novo motor"}
            </h1>
            <p className="max-w-xl text-sm text-white/70">
              Campos organizados para preenchimento rapido, com multiplas
              aplicacoes e marcacao de estoque.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex flex-1 cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <input
              type="checkbox"
              name="em_estoque"
              defaultChecked={motor?.em_estoque}
              className="h-4 w-4 accent-white"
            />
            <div className="space-y-0.5">
              <span className="inline-flex items-center gap-2 text-sm font-semibold">
                <Archive className="h-4 w-4" />
                Tag de estoque
              </span>
              <p className="text-xs text-white/65">
                Marque quando o motor estiver disponivel no estoque para reposicao.
              </p>
            </div>
          </label>

          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="space-y-0.5">
              <span className="text-sm font-semibold">Quantidade</span>
              <p className="text-xs text-white/65">Unidades disponiveis</p>
            </div>
            <input
              type="number"
              name="quantidade"
              min="1"
              defaultValue={motor?.quantidade ?? 1}
              className="ml-auto w-20 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-center text-sm font-semibold text-white [appearance:textfield] focus:outline-none focus:ring-2 focus:ring-white/30 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <section className="space-y-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Identificacao
          </p>
          <h2 className="text-lg font-semibold text-slate-950">
            Dados principais
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="descricao">
              Descricao <span className="text-red-500">*</span>
            </Label>
            <Input
              id="descricao"
              name="descricao"
              defaultValue={motor?.descricao}
              placeholder="Ex: Motor da bomba de polpa"
              required
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="marca">Marca</Label>
            <Input
              id="marca"
              name="marca"
              defaultValue={motor?.marca}
              placeholder="Ex: WEG"
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="numero_serie">Numero de serie</Label>
            <Input
              id="numero_serie"
              name="numero_serie"
              defaultValue={motor?.numero_serie}
              placeholder="Ex: SN-20240312-001"
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="status">Status atual</Label>
            <Select value={status} onValueChange={(value) => setStatus(value as MotorStatus)}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="localizacao">Localizacao fisica</Label>
            <Input
              id="localizacao"
              name="localizacao"
              defaultValue={motor?.localizacao}
              placeholder="Ex: Galpao A - Correia 3"
              className="h-11 rounded-xl"
            />
          </div>
        </div>
      </section>

      <section className="space-y-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Aplicacoes
          </p>
          <h2 className="text-lg font-semibold text-slate-950">
            Um motor para varios equipamentos
          </h2>
          <p className="text-sm text-slate-500">
            Informe um equipamento por linha para mapear todas as aplicacoes
            possiveis.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="equipamentos">Equipamentos compativeis</Label>
          <Textarea
            id="equipamentos"
            name="equipamentos"
            defaultValue={motor?.equipamentos.join("\n")}
            rows={5}
            placeholder={"Ex: Britador primario #1\nBomba de polpa reserva\nVentilador do forno"}
            className="rounded-xl"
          />
        </div>
      </section>

      <section className="space-y-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Dados tecnicos
          </p>
          <h2 className="text-lg font-semibold text-slate-950">
            Especificacoes eletricas
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="potencia_cv">Potencia (CV)</Label>
            <Input
              id="potencia_cv"
              name="potencia_cv"
              type="number"
              step="0.5"
              min="0"
              defaultValue={motor?.potencia_cv || ""}
              placeholder="Ex: 15"
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Tensao (V)</Label>
            <Select value={tensao} onValueChange={setTensao}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TENSAO_OPTIONS.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value} V
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="corrente">Corrente (A)</Label>
            <Input
              id="corrente"
              name="corrente"
              type="number"
              step="0.1"
              min="0"
              defaultValue={motor?.corrente || ""}
              placeholder="Ex: 28.5"
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rpm">Rotacao (RPM)</Label>
            <Input
              id="rpm"
              name="rpm"
              type="number"
              min="0"
              defaultValue={motor?.rpm || ""}
              placeholder="Ex: 1760"
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="carcaca">Carcaca</Label>
            <Input
              id="carcaca"
              name="carcaca"
              defaultValue={motor?.carcaca}
              placeholder="Ex: 225M"
              className="h-11 rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Protecao (IP)</Label>
            <Select value={ipProtecao} onValueChange={setIpProtecao}>
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IP_OPTIONS.map((ip) => (
                  <SelectItem key={ip} value={ip}>
                    {ip}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="space-y-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            Observacoes
          </p>
          <h2 className="text-lg font-semibold text-slate-950">
            Contexto operacional
          </h2>
          <p className="text-sm text-slate-500">
            Se o status for manutencao, os detalhamentos e o orcamento poderao
            ser atualizados ao tocar no badge de status na lista principal.
          </p>
        </div>

        <Textarea
          name="observacoes"
          defaultValue={motor?.observacoes}
          placeholder="Notas de manutencao, historico e defeitos conhecidos."
          rows={5}
          className="rounded-xl"
        />
      </section>

      <div className="sticky bottom-3 z-20 rounded-[24px] border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link href="/" className="w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              className="h-12 w-full rounded-xl sm:w-auto"
            >
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={isPending}
            className="h-12 w-full rounded-xl sm:w-auto"
          >
            <Save className="h-4 w-4" />
            {isPending
              ? "Salvando..."
              : motor
                ? "Salvar alteracoes"
                : "Cadastrar motor"}
          </Button>
        </div>
      </div>
    </form>
  );
}
