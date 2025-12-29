import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  datasource: {
    url: "postgresql://neondb_owner:npg_TGSk4iD7oJze@ep-green-term-adk9flad-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
  },

  migrations: {
    path: "prisma/migrations",
  },
});
