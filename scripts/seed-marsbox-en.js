'use strict';

const { importEnglishSeed, importPartners } = require('../src/marsbox-seed');
const marsboxEn = require('../data/marsbox-en.json');

async function main() {
  const { createStrapi, compileStrapi } = require('@strapi/strapi');

  const appContext = await compileStrapi();
  const app = await createStrapi(appContext).load();

  app.log.level = 'info';

  try {
    app.log.info('Importing English Marsbox / Volaso seed only...');
    const partnerMap = await importPartners(marsboxEn.partners);
    await importEnglishSeed(partnerMap);
    console.log('English Marsbox seed finished successfully.');
  } catch (error) {
    console.error('English Marsbox seed failed');
    console.error(error);
    process.exitCode = 1;
  }

  await app.destroy();
  process.exit(process.exitCode || 0);
}

main();
