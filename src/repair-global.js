'use strict';

const marsboxEn = require('../data/marsbox-en.json');
const marsboxTr = require('../data/marsbox-tr.json');
const { upsertGlobal } = require('./marsbox-seed');

const REPAIR_KEY = 'globalRepairV1Done';
const UID = 'api::global.global';

function buildTrGlobalFromSeed() {
  const enGlobal = marsboxEn.global;
  return {
    siteName: enGlobal.siteName,
    siteDescription: marsboxTr.global.siteDescription,
    distributorLoginUrl: enGlobal.distributorLoginUrl,
    configuratorUrl: enGlobal.configuratorUrl,
    defaultSeo: {
      ...marsboxTr.global.defaultSeo,
      shareImage: enGlobal.defaultSeo?.shareImage,
    },
    nav: marsboxTr.global.nav,
    footerColumns: marsboxTr.global.footerColumns,
    social: enGlobal.social,
    contact: enGlobal.contact,
    favicon: enGlobal.favicon,
    logo: enGlobal.logo,
  };
}

/**
 * One-time repair for a global single type that ended up with multiple underlying
 * documents (admin save updates one row while read/display resolves a stale one).
 * Same root cause as landing-page repair v2 — deletes every row, then rebuilds
 * from the seed source so component references are consistent again.
 */
async function repairGlobal({ force = false } = {}) {
  const pluginStore = strapi.store({
    environment: strapi.config.environment,
    type: 'type',
    name: 'setup',
  });

  const done = await pluginStore.get({ key: REPAIR_KEY });
  if (done && !force) {
    strapi.log.info('[REPAIR] Global repair (v1) already applied, skipping.');
    return;
  }

  try {
    const before = await strapi.db.query(UID).findMany({
      select: ['id', 'documentId', 'locale'],
    });
    const beforeIds = [...new Set(before.map((row) => row.documentId).filter(Boolean))];
    const hadTr = before.some((row) => row.locale === 'tr');

    strapi.log.info(
      `[REPAIR-GLOBAL] Before: ${before.length} row(s) across ${beforeIds.length} document(s): ${beforeIds.join(', ') || '(none)'}; tr=${hadTr}`,
    );

    for (const documentId of beforeIds) {
      await strapi.documents(UID).delete({ documentId });
      strapi.log.info(`[REPAIR-GLOBAL] Deleted global documentId=${documentId}`);
    }

    const orphan = await strapi.db.query(UID).deleteMany({ where: {} });
    strapi.log.info(
      `[REPAIR-GLOBAL] Orphan sweep removed ${orphan?.count ?? 0} residual row(s).`,
    );

    const afterDelete = await strapi.db.query(UID).count();
    strapi.log.info(`[REPAIR-GLOBAL] Rows remaining after delete: ${afterDelete} (expected 0).`);

    await upsertGlobal('en', marsboxEn.global, { overwrite: true });

    if (hadTr) {
      await upsertGlobal('tr', buildTrGlobalFromSeed(), { overwrite: true });
    }

    const finalRows = await strapi.db.query(UID).findMany({
      select: ['id', 'documentId', 'locale'],
    });
    const finalIds = [...new Set(finalRows.map((row) => row.documentId).filter(Boolean))];
    strapi.log.info(
      `[REPAIR-GLOBAL] After rebuild: ${finalRows.length} row(s) across ${finalIds.length} document(s): ${finalIds.join(', ')}`,
    );

    await pluginStore.set({ key: REPAIR_KEY, value: true });
    strapi.log.info('[REPAIR-GLOBAL] Global rebuilt cleanly from seed source (v1).');
  } catch (error) {
    strapi.log.error('[REPAIR-GLOBAL] Global repair (v1) FAILED:');
    strapi.log.error(error);
  }
}

module.exports = { repairGlobal };
