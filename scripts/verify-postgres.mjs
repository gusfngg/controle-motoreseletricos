import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL nao configurada.");
}

const sql = postgres(databaseUrl, {
  idle_timeout: 20,
  max: 1,
  prepare: false,
});

async function main() {
  const [connection] = await sql`
    SELECT current_database() AS database_name, current_user AS current_user
  `;

  const [tableCheck] = await sql`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'motors'
    ) AS motors_exists
  `;

  let totalMotors = 0;

  if (tableCheck.motors_exists) {
    const [stats] = await sql`
      SELECT COUNT(*)::int AS total_motors FROM motors
    `;
    totalMotors = stats.total_motors;
  }

  console.log(
    JSON.stringify(
      {
        database: connection.database_name,
        user: connection.current_user,
        motorsTable: tableCheck.motors_exists,
        totalMotors,
      },
      null,
      2
    )
  );
}

try {
  await main();
} finally {
  await sql.end({ timeout: 5 });
}
