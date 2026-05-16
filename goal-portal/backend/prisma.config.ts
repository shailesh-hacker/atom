import "dotenv/config";

export default {
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "ts-node prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL,
  },
};
