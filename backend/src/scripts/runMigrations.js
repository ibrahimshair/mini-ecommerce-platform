const fs = require("fs");
const path = require("path");
const { pool } = require("../config/db");

async function runMigrations() {
  console.log("🚀 Starting database migrations...");
  const client = await pool.connect();

  try {
    const migrationsDir = path.resolve(__dirname, "../../../database/migrations");
    const migrationFiles = [
      "001_create_initial_schema.sql",
      "002_seed_initial_data.sql",
    ];

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      if (fs.existsSync(filePath)) {
        console.log(`📄 Executing migration: ${file}...`);
        const sql = fs.readFileSync(filePath, "utf-8");
        await client.query(sql);
        console.log(`✅ Successfully executed: ${file}`);
      } else {
        console.warn(`⚠️ Migration file not found: ${filePath}`);
      }
    }

    console.log("🎉 All migrations executed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;
