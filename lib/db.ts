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
      onnotice: () => {},
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
  "quantidade INTEGER DEFAULT 1",
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
  const sql = getSql();

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS motors (
      ${COLUMN_DEFINITIONS.join(",\n      ")}
    )
  `);

  // Fetch all existing columns in one round-trip, then only ALTER for missing ones
  const existing = await sql.unsafe<{ column_name: string }[]>(
    `SELECT column_name FROM information_schema.columns WHERE table_name = 'motors'`
  );
  const existingSet = new Set(existing.map((r) => r.column_name));

  const missing = COLUMN_DEFINITIONS.filter((def) => {
    const [col] = def.split(" ");
    return col !== "id" && !existingSet.has(col);
  });

  for (const definition of missing) {
    await sql.unsafe(`ALTER TABLE motors ADD COLUMN IF NOT EXISTS ${definition}`);
  }

  // Run index creation in parallel
  await Promise.all([
    sql.unsafe(`CREATE INDEX IF NOT EXISTS motors_status_idx ON motors (status)`),
    sql.unsafe(`CREATE INDEX IF NOT EXISTS motors_updated_at_idx ON motors (updated_at DESC)`),
  ]);
}

async function ensureUpdateTimestampTrigger() {
  const sql = getSql();

  // Check if trigger already exists before recreating it
  const result = await sql.unsafe<{ exists: boolean }[]>(
    `SELECT EXISTS (
      SELECT 1 FROM pg_trigger
      WHERE tgname = 'update_motors_timestamp'
    ) as exists`
  );

  if (result[0]?.exists) {
    return;
  }

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
