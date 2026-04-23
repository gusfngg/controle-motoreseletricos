"use client";

import Link from "next/link";
import { ReactNode, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-zinc-900">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50">
              <Wrench className="h-3.5 w-3.5 text-amber-600" />
            </div>
            Manutenção
          </DialogTitle>
          <DialogDescription className="text-sm text-zinc-500">
            <span className="font-medium text-zinc-800">{motor.descricao}</span>
          </DialogDescription>
        </DialogHeader>

        <form action={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor={`manutencao_inicio-${motor.id}`} className="text-xs font-medium text-zinc-600">
                Entrada
              </Label>
              <Input
                id={`manutencao_inicio-${motor.id}`}
                name="manutencao_inicio"
                type="date"
                defaultValue={motor.manutencao.started_at}
                className="h-9 rounded-lg border-zinc-200 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor={`manutencao_previsao-${motor.id}`} className="text-xs font-medium text-zinc-600">
                Previsão de retorno
              </Label>
              <Input
                id={`manutencao_previsao-${motor.id}`}
                name="manutencao_previsao"
                type="date"
                defaultValue={motor.manutencao.expected_back_at}
                className="h-9 rounded-lg border-zinc-200 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor={`manutencao_fornecedor-${motor.id}`} className="text-xs font-medium text-zinc-600">
              Fornecedor
            </Label>
            <Input
              id={`manutencao_fornecedor-${motor.id}`}
              name="manutencao_fornecedor"
              defaultValue={motor.manutencao.supplier}
              placeholder="Ex: Oficina Motores Silva"
              className="h-9 rounded-lg border-zinc-200 text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor={`orcamento-${motor.id}`} className="text-xs font-medium text-zinc-600">
              Orçamento
            </Label>
            <Input
              id={`orcamento-${motor.id}`}
              name="orcamento"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
              className="h-9 rounded-lg border-zinc-200 text-sm"
            />
            {motor.manutencao.quote_file_path && (
              <Link
                href={motor.manutencao.quote_file_path}
                target="_blank"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 underline underline-offset-4 hover:text-zinc-900"
              >
                <FileUp className="h-3.5 w-3.5" />
                Ver orçamento arquivado
              </Link>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor={`manutencao_observacoes-${motor.id}`} className="text-xs font-medium text-zinc-600">
              Observações
            </Label>
            <Textarea
              id={`manutencao_observacoes-${motor.id}`}
              name="manutencao_observacoes"
              defaultValue={motor.manutencao.notes}
              rows={4}
              placeholder="Defeito, serviço executado, aprovação do orçamento..."
              className="rounded-lg border-zinc-200 text-sm"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="h-9 rounded-lg border-zinc-200 text-sm text-zinc-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="h-9 rounded-lg bg-zinc-950 text-sm text-white hover:bg-zinc-800"
            >
              {isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
