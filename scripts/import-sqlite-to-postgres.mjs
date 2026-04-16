import path from "node:path";
import { createClient } from "@libsql/client";
import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL nao configurada.");
}

const sqlitePath = path.join(process.cwd(), "motors.db");
const sqlite = createClient({
  url: `file:${sqlitePath}`,
});

const sql = postgres(databaseUrl, {
  idle_timeout: 20,
  max: 1,
  prepare: false,
});

function getText(row, key) {
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

function getNumber(row, key) {
  const value = row[key];

  if (typeof value === "number") {
    return value;
  }

  return Number(value ?? 0);
}

function serializeEquipamentos(row) {
  const currentValue = getText(row, "equipamentos").trim();

  if (currentValue) {
    return currentValue;
  }

  const legacyEquipamento = getText(row, "equipamento").trim();

  if (!legacyEquipamento) {
    return "[]";
  }

  return JSON.stringify([legacyEquipamento]);
}

async function initPostgres() {
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS motors (
      id BIGSERIAL PRIMARY KEY,
      descricao TEXT NOT NULL,
      marca TEXT DEFAULT '',
      numero_serie TEXT DEFAULT '',
      potencia_cv DOUBLE PRECISION DEFAULT 0,
      tensao DOUBLE PRECISION DEFAULT 0,
      corrente DOUBLE PRECISION DEFAULT 0,
      rpm INTEGER DEFAULT 0,
      carcaca TEXT DEFAULT '',
      ip_protecao TEXT DEFAULT '',
      status TEXT DEFAULT 'disponivel',
      em_estoque INTEGER DEFAULT 0,
      equipamentos TEXT DEFAULT '[]',
      localizacao TEXT DEFAULT '',
      observacoes TEXT DEFAULT '',
      ultima_modificacao TEXT DEFAULT 'Motor cadastrado',
      manutencao_inicio TEXT DEFAULT '',
      manutencao_fornecedor TEXT DEFAULT '',
      manutencao_previsao TEXT DEFAULT '',
      manutencao_orcamento_path TEXT DEFAULT '',
      manutencao_observacoes TEXT DEFAULT '',
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await sql.unsafe(`
    CREATE OR REPLACE FUNCTION set_motors_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await sql.unsafe(`
    DROP TRIGGER IF EXISTS update_motors_timestamp ON motors
  `);

  await sql.unsafe(`
    CREATE TRIGGER update_motors_timestamp
    BEFORE UPDATE ON motors
    FOR EACH ROW
    EXECUTE FUNCTION set_motors_updated_at()
  `);
}

async function main() {
  const result = await sqlite.execute("SELECT * FROM motors ORDER BY id ASC");
  const rows = result.rows.map((row) => row);

  await initPostgres();

  await sql.begin(async (transaction) => {
    for (const row of rows) {
      await transaction`
        INSERT INTO motors (
          id,
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
          ultima_modificacao,
          manutencao_inicio,
          manutencao_fornecedor,
          manutencao_previsao,
          manutencao_orcamento_path,
          manutencao_observacoes,
          created_at,
          updated_at
        ) VALUES (
          ${getNumber(row, "id")},
          ${getText(row, "descricao")},
          ${getText(row, "marca")},
          ${getText(row, "numero_serie")},
          ${getNumber(row, "potencia_cv")},
          ${getNumber(row, "tensao")},
          ${getNumber(row, "corrente")},
          ${getNumber(row, "rpm")},
          ${getText(row, "carcaca")},
          ${getText(row, "ip_protecao")},
          ${getText(row, "status") || "disponivel"},
          ${getNumber(row, "em_estoque")},
          ${serializeEquipamentos(row)},
          ${getText(row, "localizacao")},
          ${getText(row, "observacoes")},
          ${getText(row, "ultima_modificacao") || "Cadastro importado"},
          ${getText(row, "manutencao_inicio")},
          ${getText(row, "manutencao_fornecedor")},
          ${getText(row, "manutencao_previsao")},
          ${getText(row, "manutencao_orcamento_path")},
          ${getText(row, "manutencao_observacoes")},
          ${getText(row, "created_at") || new Date().toISOString()},
          ${getText(row, "updated_at") || new Date().toISOString()}
        )
        ON CONFLICT (id) DO UPDATE SET
          descricao = EXCLUDED.descricao,
          marca = EXCLUDED.marca,
          numero_serie = EXCLUDED.numero_serie,
          potencia_cv = EXCLUDED.potencia_cv,
          tensao = EXCLUDED.tensao,
          corrente = EXCLUDED.corrente,
          rpm = EXCLUDED.rpm,
          carcaca = EXCLUDED.carcaca,
          ip_protecao = EXCLUDED.ip_protecao,
          status = EXCLUDED.status,
          em_estoque = EXCLUDED.em_estoque,
          equipamentos = EXCLUDED.equipamentos,
          localizacao = EXCLUDED.localizacao,
          observacoes = EXCLUDED.observacoes,
          ultima_modificacao = EXCLUDED.ultima_modificacao,
          manutencao_inicio = EXCLUDED.manutencao_inicio,
          manutencao_fornecedor = EXCLUDED.manutencao_fornecedor,
          manutencao_previsao = EXCLUDED.manutencao_previsao,
          manutencao_orcamento_path = EXCLUDED.manutencao_orcamento_path,
          manutencao_observacoes = EXCLUDED.manutencao_observacoes,
          created_at = EXCLUDED.created_at,
          updated_at = EXCLUDED.updated_at
      `;
    }

    await transaction.unsafe(`
      SELECT setval(
        pg_get_serial_sequence('motors', 'id'),
        COALESCE((SELECT MAX(id) FROM motors), 1),
        true
      )
    `);
  });

  console.log(`Importacao concluida: ${rows.length} motor(es) enviados para o Postgres.`);
}

try {
  await main();
} finally {
  await sql.end({ timeout: 5 });
}
