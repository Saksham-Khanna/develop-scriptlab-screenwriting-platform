import "dotenv/config";
import { seed } from "../src/server/seed";
import { pool } from "../src/db";

seed({ force: process.argv.includes("--force") })
  .then((r) => console.log(r.seeded ? "Database seeded." : "Database already contains data (use --force to reseed)."))
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => pool.end());
