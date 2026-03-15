import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log("Running migrations...");

  await sql`
    CREATE TABLE IF NOT EXISTS assessments (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

      -- Contact info
      email TEXT NOT NULL,
      name TEXT NOT NULL,
      company_name TEXT NOT NULL,
      industry TEXT NOT NULL,
      company_size TEXT,
      website_url TEXT,

      -- Survey responses
      current_ai_usage TEXT,
      biggest_challenge TEXT,
      ai_tools_used TEXT[],
      data_readiness TEXT,
      budget_range TEXT,

      -- Report output
      report_json JSONB,
      overall_score INTEGER,

      -- Meta
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_assessments_email ON assessments(email)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_assessments_industry ON assessments(industry)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_assessments_score ON assessments(overall_score)`;

  console.log("Migrations complete.");
}

migrate().catch(console.error);
