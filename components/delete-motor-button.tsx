"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteMotor } from "@/lib/actions";

interface DeleteMotorButtonProps {
  id: number;
  descricao: string;
  mode?: "icon" | "full";
}

export function DeleteMotorButton({
  id,
  descricao,
  mode = "icon",
}: DeleteMotorButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteMotor(id);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {mode === "full" ? (
          <Button
            variant="outline"
            className="h-9 flex-1 rounded-lg border-zinc-200 text-zinc-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Excluir
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
            <Trash2 className="h-5 w-5 text-red-600" />
          </div>
          <DialogTitle className="text-base font-semibold text-zinc-900">
            Excluir motor
          </DialogTitle>
          <DialogDescription className="text-sm text-zinc-500">
            Tem certeza que deseja excluir{" "}
            <span className="font-medium text-zinc-900">{descricao}</span>? Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
            className="h-9 rounded-lg border-zinc-200 text-zinc-700"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isPending}
            className="h-9 rounded-lg bg-red-600 text-white hover:bg-red-700"
          >
            {isPending ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
