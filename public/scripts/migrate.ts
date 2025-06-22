import * as postgres from 'postgres';
import { config } from 'dotenv';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Load environment variables from the project root
config({ path: join(__dirname, '../../.env') });

const { VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY } = process.env;

console.log('VITE_SUPABASE_URL:', VITE_SUPABASE_URL);

if (!VITE_SUPABASE_URL || !VITE_SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing required environment variables');
  process.exit(1);
}

// The VITE_SUPABASE_URL is in the format https://<project-ref>.supabase.co
// The connection string needs to be in the format postgresql://postgres:<password>@db.<project-ref>.supabase.co:5432/postgres
const match = VITE_SUPABASE_URL.match(/https?:\/\/([^.]+)\.supabase\./);
if (!match) {
  console.error('Could not parse project reference from Supabase URL');
  process.exit(1);
}
const projectRef = match[1];
const connectionString = `postgresql://postgres:${VITE_SUPABASE_SERVICE_ROLE_KEY}@db.${projectRef}.supabase.co:5432/postgres`;

console.log('Constructed Connection String:', connectionString);

const sql = postgres(connectionString);

async function runMigrations() {
  try {
    // Create migrations table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS _migrations (
        name TEXT PRIMARY KEY,
        executed_at TIMESTAMP WITH TIME ZONE NOT NULL
      );
    `;
    console.log('Migrations table checked/created.');

    const migrationsDir = join(__dirname, '../../supabase/migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log('Found migration files:', migrationFiles);

    for (const file of migrationFiles) {
      const [existing] = await sql`
        SELECT name FROM _migrations WHERE name = ${file}
      `;

      if (existing) {
        console.log(`Migration ${file} already executed, skipping...`);
        continue;
      }

      console.log(`Running migration: ${file}`);
      const query = readFileSync(join(migrationsDir, file), 'utf8');
      
      await sql.unsafe(query);

      await sql`
        INSERT INTO _migrations (name, executed_at) VALUES (${file}, ${new Date()})
      `;

      console.log(`Successfully executed migration: ${file}`);
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runMigrations(); 