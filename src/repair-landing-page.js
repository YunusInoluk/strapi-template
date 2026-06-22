'use strict';

const marsboxEn = require('../data/marsbox-en.json');
const { importPartners, upsertLandingPage } = require('./marsbox-seed');

const REPAIR_KEY = 'landingPageRepairV2Done';
const UID = 'api::landing-page.landing-page';

/**
 * One-time repair for a landing-page single type that ended up with multiple
 * underlying documents (the admin "save" view updates one document while the
 * read/display resolver returns a different, stale one — so edits appear to
 * succeed but always revert to the old value).
 *
 * v1 only deleted documents that had a draft (findMany status:'draft'), which
 * left published-only ghost documents behind. v2 enumerates every row at the
 * entity level (status/locale agnostic), deletes each unique document via the
 * document service (proper component cascade), sweeps any orphan rows, then
 * recreates exactly one clean document from the seed source.
 */
async function repairLandingPage({ force = false } = {}) {
  const pluginStore = strapi.store({
    environment: strapi.config.environment,
    type: 'type',
    name: 'setup',
  });

  const done = await pluginStore.get({ key: REPAIR_KEY });
  if (done && !force) {
    strapi.log.info('[REPAIR] Landing page repair (v2) already applied, skipping.');
    return;
  }

  try {
    const before = await strapi.db.query(UID).findMany({ select: ['id', 'documentId'] });
    const beforeIds = [...new Set(before.map((row) => row.documentId).filter(Boolean))];
    strapi.log.info(
      `[REPAIR] Before: ${before.length} row(s) across ${beforeIds.length} document(s): ${beforeIds.join(', ') || '(none)'}`,
    );

    for (const documentId of beforeIds) {
      await strapi.documents(UID).delete({ documentId });
      strapi.log.info(`[REPAIR] Deleted landing-page documentId=${documentId}`);
    }

    const orphan = await strapi.db.query(UID).deleteMany({ where: {} });
    strapi.log.info(`[REPAIR] Orphan sweep removed ${orphan?.count ?? 0} residual row(s).`);

    const afterDelete = await strapi.db.query(UID).count();
    strapi.log.info(`[REPAIR] Rows remaining after delete: ${afterDelete} (expected 0).`);

    const partnerMap = await importPartners(marsboxEn.partners);
    await upsertLandingPage('en', marsboxEn.landingPage, partnerMap, { overwrite: true });

    const finalRows = await strapi.db.query(UID).findMany({ select: ['id', 'documentId'] });
    const finalIds = [...new Set(finalRows.map((row) => row.documentId).filter(Boolean))];
    strapi.log.info(
      `[REPAIR] After rebuild: ${finalRows.length} row(s) across ${finalIds.length} document(s): ${finalIds.join(', ')}`,
    );

    await pluginStore.set({ key: REPAIR_KEY, value: true });
    strapi.log.info('[REPAIR] Landing page rebuilt cleanly from seed source (v2).');
  } catch (error) {
    strapi.log.error('[REPAIR] Landing page repair (v2) FAILED:');
    strapi.log.error(error);
  }
}

module.exports = { repairLandingPage };
