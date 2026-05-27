import "dotenv/config";
import { defineConfig } from "prisma/config";

// Prisma 7: connection URL lives here (not in schema.prisma).
// Placeholder allows `prisma generate` during CI/Render build without a live DB.
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://build:build@127.0.0.1:5432/build?sslmode=disable";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
