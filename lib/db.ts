import postgres, { type Sql } from "postgres";

type ExecuteInput =
  | string
  | {
      sql: string;
      args?: unknown[];
    };

function getDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL nao configurada. Defina a conexao do Postgres para executar o app."
    );
  }

  return databaseUrl;
}

let sqlClient: Sql | null = null;

function getSql() {
  if (!sqlClient) {
    sqlClient = postgres(getDatabaseUrl(), {
      idle_timeout: 20,
      max: 5,
      prepare: false,
    });
  }

  return sqlClient;
}

function withPostgresPlaceholders(statement: string) {
  let index = 0;

  return statement.replace(/\?/g, () => `$${++index}`);
}

export const db = {
  async execute(input: ExecuteInput) {
    const statement = typeof input === "string" ? input : input.sql;
    const args = typeof input === "string" ? [] : (input.args ?? []);
    const query = args.length
      ? withPostgresPlaceholders(statement)
      : statement;
    const rows = await getSql().unsafe(query, args as never[]);

    return { rows };
  },
};

const COLUMN_DEFINITIONS = [
  "id BIGSERIAL PRIMARY KEY",
  "descricao TEXT NOT NULL",
  "marca TEXT DEFAULT ''",
  "numero_serie TEXT DEFAULT ''",
  "potencia_cv DOUBLE PRECISION DEFAULT 0",
  "tensao DOUBLE PRECISION DEFAULT 0",
  "corrente DOUBLE PRECISION DEFAULT 0",
  "rpm INTEGER DEFAULT 0",
  "carcaca TEXT DEFAULT ''",
  "ip_protecao TEXT DEFAULT ''",
  "status TEXT DEFAULT 'disponivel'",
  "em_estoque INTEGER DEFAULT 0",
  "equipamentos TEXT DEFAULT '[]'",
  "localizacao TEXT DEFAULT ''",
  "observacoes TEXT DEFAULT ''",
  "ultima_modificacao TEXT DEFAULT 'Motor cadastrado'",
  "manutencao_inicio TEXT DEFAULT ''",
  "manutencao_fornecedor TEXT DEFAULT ''",
  "manutencao_previsao TEXT DEFAULT ''",
  "manutencao_orcamento_path TEXT DEFAULT ''",
  "manutencao_observacoes TEXT DEFAULT ''",
  "created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP",
  "updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP",
];

let initPromise: Promise<void> | null = null;

async function ensureMotorsTable() {
  await getSql().unsafe(`
    CREATE TABLE IF NOT EXISTS motors (
      ${COLUMN_DEFINITIONS.join(",\n      ")}
    )
  `);

  for (const definition of COLUMN_DEFINITIONS) {
    const [columnName] = definition.split(" ");

    if (columnName === "id") {
      continue;
    }

    await getSql().unsafe(
      `ALTER TABLE motors ADD COLUMN IF NOT EXISTS ${definition}`
    );
  }

  await getSql().unsafe(`
    CREATE INDEX IF NOT EXISTS motors_status_idx ON motors (status)
  `);
  await getSql().unsafe(`
    CREATE INDEX IF NOT EXISTS motors_updated_at_idx ON motors (updated_at DESC)
  `);
}

async function ensureUpdateTimestampTrigger() {
  await getSql().unsafe(`
    CREATE OR REPLACE FUNCTION set_motors_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `);

  await getSql().unsafe(`
    DROP TRIGGER IF EXISTS update_motors_timestamp ON motors
  `);

  await getSql().unsafe(`
    CREATE TRIGGER update_motors_timestamp
    BEFORE UPDATE ON motors
    FOR EACH ROW
    EXECUTE FUNCTION set_motors_updated_at()
  `);
}

export async function initDB() {
  if (!initPromise) {
    initPromise = (async () => {
      await ensureMotorsTable();
      await ensureUpdateTimestampTrigger();
    })().catch((error) => {
      initPromise = null;
      throw error;
    });
  }

  await initPromise;
}

export async function closeDB() {
  if (!sqlClient) {
    return;
  }

  await sqlClient.end({ timeout: 5 });
  sqlClient = null;
}
