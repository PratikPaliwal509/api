import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  datasource: {
    url: "",
  },

  migrations: {
    path: "prisma/migrations",
  },
});
