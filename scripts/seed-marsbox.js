'use strict';

const { importMarsboxSeed } = require('../src/marsbox-seed');

async function main() {
  const force = process.argv.includes('--force');
  const withTr = process.argv.includes('--with-tr');
  const { createStrapi, compileStrapi } = require('@strapi/strapi');

  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();

  app.log.level = 'info';

  try {
    await importMarsboxSeed({ force, withTr });
    console.log('Marsbox seed finished successfully.');
  } catch (error) {
    console.error('Marsbox seed failed');
    console.error(error);
    process.exitCode = 1;
  }

  await app.destroy();
  process.exit(process.exitCode || 0);
}

main();
