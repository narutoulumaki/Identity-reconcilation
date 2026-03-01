const fs = require('fs');
const path = require('path');

// read base schema
const basePath = path.join(__dirname, '..', 'prisma', 'schema.base.prisma');
const targetPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

let provider = process.env.DATABASE_PROVIDER;

// Auto-detect provider from DATABASE_URL if not explicitly set
if (!provider) {
  const dbUrl = process.env.DATABASE_URL || '';
  if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
    provider = 'postgresql';
    console.log('Auto-detected PostgreSQL from DATABASE_URL');
  } else if (dbUrl.startsWith('file:')) {
    provider = 'sqlite';
    console.log('Auto-detected SQLite from DATABASE_URL');
  } else {
    provider = 'sqlite'; // default fallback
    console.warn('Could not detect provider, defaulting to sqlite');
  }
}

if (!['sqlite', 'postgresql'].includes(provider)) {
  console.warn(`Unknown DATABASE_PROVIDER '${provider}', defaulting to sqlite`);
  provider = 'sqlite';
}

const content = fs.readFileSync(basePath, 'utf-8');
const replaced = content.replace('{PROVIDER}', provider);
fs.writeFileSync(targetPath, replaced);
console.log(`wrote schema.prisma with provider=${provider}`);
