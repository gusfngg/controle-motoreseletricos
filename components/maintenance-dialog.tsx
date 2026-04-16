"use client";

import Link from "next/link";
import { ReactNode, useState, useTransition } from "react";
import { FileUp, Wrench } from "lucide-react";
import { updateMaintenanceDetails } from "@/lib/actions";
import { Motor } from "@/types/motor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface MaintenanceDialogProps {
  motor: Motor;
  children: ReactNode;
}

export function MaintenanceDialog({
  motor,
  children,
}: MaintenanceDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    setError(null);

    startTransition(async () => {
      const result = await updateMaintenanceDetails(motor.id, formData);

      if (result?.error) {
        setError(result.error);
        return;
      }

      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-black">
            <Wrench className="h-4 w-4 text-amber-600" />
            Detalhes da manutencao
          </DialogTitle>
          <DialogDescription>
            Registre o historico de manutencao do motor{" "}
            <span className="font-semibold text-black">{motor.descricao}</span>.
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`manutencao_inicio-${motor.id}`}>
                Entrada em manutencao
              </Label>
              <Input
                id={`manutencao_inicio-${motor.id}`}
                name="manutencao_inicio"
                type="date"
                defaultValue={motor.manutencao.started_at}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor={`manutencao_previsao-${motor.id}`}>
                Previsao de volta
              </Label>
              <Input
                id={`manutencao_previsao-${motor.id}`}
                name="manutencao_previsao"
                type="date"
                defaultValue={motor.manutencao.expected_back_at}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`manutencao_fornecedor-${motor.id}`}>
              Fornecedor responsavel
            </Label>
            <Input
              id={`manutencao_fornecedor-${motor.id}`}
              name="manutencao_fornecedor"
              defaultValue={motor.manutencao.supplier}
              placeholder="Ex: Oficina Motores Silva"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`orcamento-${motor.id}`}>Arquivar orcamento</Label>
            <Input
              id={`orcamento-${motor.id}`}
              name="orcamento"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
            />
            {motor.manutencao.quote_file_path && (
              <Link
                href={motor.manutencao.quote_file_path}
                target="_blank"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 underline underline-offset-4"
              >
                <FileUp className="h-4 w-4" />
                Abrir ultimo orcamento arquivado
              </Link>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`manutencao_observacoes-${motor.id}`}>
              Detalhamentos
            </Label>
            <Textarea
              id={`manutencao_observacoes-${motor.id}`}
              name="manutencao_observacoes"
              defaultValue={motor.manutencao.notes}
              rows={5}
              placeholder="Descreva defeito, servico executado, aprovacao do orcamento e outras observacoes."
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar manutencao"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
