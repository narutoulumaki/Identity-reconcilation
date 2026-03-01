const fs = require('fs');
const path = require('path');

// read base schema
const basePath = path.join(__dirname, '..', 'prisma', 'schema.base.prisma');
const targetPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

let provider = process.env.DATABASE_PROVIDER || 'sqlite';
if (!['sqlite', 'postgresql'].includes(provider)) {
  console.warn(`Unknown DATABASE_PROVIDER '${provider}', defaulting to sqlite`);
  provider = 'sqlite';
}

const content = fs.readFileSync(basePath, 'utf-8');
const replaced = content.replace('{PROVIDER}', provider);
fs.writeFileSync(targetPath, replaced);
console.log(`wrote schema.prisma with provider=${provider}`);
