"use server";

import { put } from "@vercel/blob";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db, initDB } from "./db";
import {
  Motor,
  MotorFormData,
  MotorStats,
  MotorStatus,
} from "@/types/motor";

const quoteUploadDir = path.join(
  process.cwd(),
  "public",
  "uploads",
  "orcamentos"
);

function getText(row: Record<string, unknown>, key: string) {
  const value = row[key];

  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function getNumber(row: Record<string, unknown>, key: string) {
  const value = row[key];

  if (typeof value === "number") {
    return value;
  }

  return Number(value ?? 0);
}

function parseEquipamentos(rawValue: string) {
  return rawValue
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function parseEquipamentosFromDB(row: Record<string, unknown>) {
  const rawValue = row.equipamentos;

  if (Array.isArray(rawValue)) {
    return rawValue.map((item) => String(item).trim()).filter(Boolean);
  }

  const serialized = getText(row, "equipamentos");

  if (serialized) {
    try {
      const parsed = JSON.parse(serialized);

      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item).trim())
          .filter(Boolean);
      }
    } catch {
      return parseEquipamentos(serialized);
    }
  }

  const legacyEquipamento = getText(row, "equipamento");
  return legacyEquipamento ? [legacyEquipamento] : [];
}

function serializeEquipamentos(equipamentos: string[]) {
  return JSON.stringify(
    equipamentos.map((item) => item.trim()).filter(Boolean)
  );
}

function normalizeMotor(row: Record<string, unknown>): Motor {
  return {
    id: getNumber(row, "id"),
    descricao: getText(row, "descricao"),
    marca: getText(row, "marca"),
    numero_serie: getText(row, "numero_serie"),
    potencia_cv: getNumber(row, "potencia_cv"),
    tensao: getNumber(row, "tensao"),
    corrente: getNumber(row, "corrente"),
    rpm: getNumber(row, "rpm"),
    carcaca: getText(row, "carcaca"),
    ip_protecao: getText(row, "ip_protecao"),
    status: (getText(row, "status") || "disponivel") as MotorStatus,
    em_estoque: getNumber(row, "em_estoque") === 1,
    equipamentos: parseEquipamentosFromDB(row),
    localizacao: getText(row, "localizacao"),
    observacoes: getText(row, "observacoes"),
    ultima_modificacao:
      getText(row, "ultima_modificacao") || "Cadastro atualizado",
    manutencao: {
      started_at: getText(row, "manutencao_inicio"),
      supplier: getText(row, "manutencao_fornecedor"),
      expected_back_at: getText(row, "manutencao_previsao"),
      quote_file_path: getText(row, "manutencao_orcamento_path"),
      notes: getText(row, "manutencao_observacoes"),
    },
    created_at: getText(row, "created_at"),
    updated_at: getText(row, "updated_at"),
  };
}

function describeCreate(data: MotorFormData) {
  if (data.status === "manutencao") {
    return "Motor cadastrado em manutencao";
  }

  if (data.em_estoque) {
    return "Motor cadastrado em estoque";
  }

  return "Motor cadastrado";
}

function describeUpdate(previous: Motor, next: MotorFormData) {
  if (previous.status !== next.status) {
    switch (next.status) {
      case "manutencao":
        return "Motor enviado para manutencao";
      case "reparo":
        return "Motor enviado para reparo";
      case "em_uso":
        return "Motor liberado para uso";
      case "disponivel":
        return "Motor marcado como disponivel";
      case "sucateado":
        return "Motor marcado como sucateado";
      default:
        return "Status do motor atualizado";
    }
  }

  if (previous.em_estoque !== next.em_estoque) {
    return next.em_estoque
      ? "Motor enviado para estoque"
      : "Motor retirado do estoque";
  }

  if (
    JSON.stringify(previous.equipamentos) !== JSON.stringify(next.equipamentos)
  ) {
    return "Aplicacoes do motor atualizadas";
  }

  return "Cadastro do motor atualizado";
}

async function ensureDB() {
  await initDB();
}

async function getMotorRow(id: number) {
  await ensureDB();
  const result = await db.execute({
    sql: "SELECT * FROM motors WHERE id = ?",
    args: [id],
  });

  return (result.rows[0] as Record<string, unknown> | undefined) ?? null;
}

async function saveQuoteFile(file: File) {
  const extension = path.extname(file.name) || ".bin";
  const fileName = `${Date.now()}-${randomUUID()}${extension}`;
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  if (blobToken) {
    const blob = await put(`orcamentos/${fileName}`, file, {
      access: "public",
      addRandomSuffix: false,
      token: blobToken,
    });

    return blob.url;
  }

  await fs.mkdir(quoteUploadDir, { recursive: true });
  const filePath = path.join(quoteUploadDir, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await fs.writeFile(filePath, buffer);

  return `/uploads/orcamentos/${fileName}`;
}

export async function getMotors() {
  await ensureDB();
  const result = await db.execute(
    "SELECT * FROM motors ORDER BY updated_at DESC, id DESC"
  );

  return result.rows.map((row) => normalizeMotor(row as Record<string, unknown>));
}

export async function getMotorById(id: number) {
  const row = await getMotorRow(id);

  if (!row) {
    return null;
  }

  return normalizeMotor(row);
}

export async function createMotor(data: MotorFormData) {
  await ensureDB();

  await db.execute({
    sql: `INSERT INTO motors (
            descricao,
            marca,
            numero_serie,
            potencia_cv,
            tensao,
            corrente,
            rpm,
            carcaca,
            ip_protecao,
            status,
            em_estoque,
            equipamentos,
            localizacao,
            observacoes,
            ultima_modificacao
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      data.descricao,
      data.marca,
      data.numero_serie,
      data.potencia_cv,
      data.tensao,
      data.corrente,
      data.rpm,
      data.carcaca,
      data.ip_protecao,
      data.status,
      data.em_estoque ? 1 : 0,
      serializeEquipamentos(data.equipamentos),
      data.localizacao,
      data.observacoes,
      describeCreate(data),
    ],
  });

  revalidatePath("/");
  redirect("/");
}

export async function updateMotor(id: number, data: MotorFormData) {
  const row = await getMotorRow(id);

  if (!row) {
    throw new Error("Motor nao encontrado.");
  }

  const previous = normalizeMotor(row);

  await db.execute({
    sql: `UPDATE motors
          SET descricao=?,
              marca=?,
              numero_serie=?,
              potencia_cv=?,
              tensao=?,
              corrente=?,
              rpm=?,
              carcaca=?,
              ip_protecao=?,
              status=?,
              em_estoque=?,
              equipamentos=?,
              localizacao=?,
              observacoes=?,
              ultima_modificacao=?
          WHERE id=?`,
    args: [
      data.descricao,
      data.marca,
      data.numero_serie,
      data.potencia_cv,
      data.tensao,
      data.corrente,
      data.rpm,
      data.carcaca,
      data.ip_protecao,
      data.status,
      data.em_estoque ? 1 : 0,
      serializeEquipamentos(data.equipamentos),
      data.localizacao,
      data.observacoes,
      describeUpdate(previous, data),
      id,
    ],
  });

  revalidatePath("/");
  redirect("/");
}

export async function updateMaintenanceDetails(id: number, formData: FormData) {
  const row = await getMotorRow(id);

  if (!row) {
    return { error: "Motor nao encontrado." };
  }

  const motor = normalizeMotor(row);
  const uploadedQuote = formData.get("orcamento");
  let quoteFilePath = motor.manutencao.quote_file_path;

  if (
    uploadedQuote &&
    typeof uploadedQuote === "object" &&
    "size" in uploadedQuote &&
    Number(uploadedQuote.size) > 0 &&
    "arrayBuffer" in uploadedQuote
  ) {
    quoteFilePath = await saveQuoteFile(uploadedQuote as File);
  }

  const startedAt = String(formData.get("manutencao_inicio") ?? "");
  const supplier = String(formData.get("manutencao_fornecedor") ?? "");
  const expectedBackAt = String(formData.get("manutencao_previsao") ?? "");
  const notes = String(formData.get("manutencao_observacoes") ?? "");

  const lastChange =
    quoteFilePath !== motor.manutencao.quote_file_path
      ? "Orcamento de manutencao arquivado"
      : "Detalhes de manutencao atualizados";

  await db.execute({
    sql: `UPDATE motors
          SET manutencao_inicio=?,
              manutencao_fornecedor=?,
              manutencao_previsao=?,
              manutencao_orcamento_path=?,
              manutencao_observacoes=?,
              ultima_modificacao=?
          WHERE id=?`,
    args: [
      startedAt,
      supplier,
      expectedBackAt,
      quoteFilePath,
      notes,
      lastChange,
      id,
    ],
  });

  revalidatePath("/");
  return { success: true };
}

export async function toggleMotorStock(id: number, nextValue: boolean) {
  const row = await getMotorRow(id);

  if (!row) {
    return { error: "Motor nao encontrado." };
  }

  await db.execute({
    sql: `UPDATE motors
          SET em_estoque=?,
              ultima_modificacao=?
          WHERE id=?`,
    args: [
      nextValue ? 1 : 0,
      nextValue ? "Motor enviado para estoque" : "Motor retirado do estoque",
      id,
    ],
  });

  revalidatePath("/");
  return { success: true };
}

export async function deleteMotor(id: number) {
  await ensureDB();
  await db.execute({
    sql: "DELETE FROM motors WHERE id = ?",
    args: [id],
  });
  revalidatePath("/");
}

export async function getStats(): Promise<MotorStats> {
  await ensureDB();
  const result = await db.execute(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'disponivel' THEN 1 ELSE 0 END) as disponiveis,
      SUM(CASE WHEN status = 'em_uso' THEN 1 ELSE 0 END) as em_uso,
      SUM(CASE WHEN status = 'manutencao' THEN 1 ELSE 0 END) as manutencao,
      SUM(CASE WHEN status = 'reparo' THEN 1 ELSE 0 END) as reparo,
      SUM(CASE WHEN status = 'sucateado' THEN 1 ELSE 0 END) as sucateado,
      SUM(CASE WHEN em_estoque = 1 THEN 1 ELSE 0 END) as estoque
    FROM motors
  `);

  const row = (result.rows[0] as Record<string, unknown> | undefined) ?? {};

  return {
    total: getNumber(row, "total"),
    disponiveis: getNumber(row, "disponiveis"),
    em_uso: getNumber(row, "em_uso"),
    manutencao: getNumber(row, "manutencao"),
    reparo: getNumber(row, "reparo"),
    sucateado: getNumber(row, "sucateado"),
    estoque: getNumber(row, "estoque"),
  };
}
