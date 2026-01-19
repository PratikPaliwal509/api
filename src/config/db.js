const { PrismaClient } = require('@prisma/client');

const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

const connectionString = process.env.DATABASE_URL;

const pool = new pg.Pool({ connectionString });

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Optional: log queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$use(async (params, next) => {
    return next(params);
  });
}

module.exports = prisma;
