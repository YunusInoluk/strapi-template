'use strict';

const marsboxEn = require('../data/marsbox-en.json');
const { importPartners, upsertLandingPage } = require('./marsbox-seed');

const REPAIR_KEY = 'landingPageRepairV1Done';
const UID = 'api::landing-page.landing-page';

/**
 * One-time repair for a landing-page document whose draft/published component
 * references became inconsistent (admin returns a component id on read that the
 * update rejects with "Some of the provided components ... are not related to
 * the entity"). Deletes the corrupted document and recreates it cleanly from the
 * seed source, which produces consistent component ids again.
 */
async function repairLandingPage({ force = false } = {}) {
  const pluginStore = strapi.store({
    environment: strapi.config.environment,
    type: 'type',
    name: 'setup',
  });

  const done = await pluginStore.get({ key: REPAIR_KEY });
  if (done && !force) {
    strapi.log.info('[REPAIR] Landing page repair already applied, skipping.');
    return;
  }

  try {
    const existing = await strapi.documents(UID).findMany({ status: 'draft' });
    for (const doc of existing) {
      await strapi.documents(UID).delete({ documentId: doc.documentId });
      strapi.log.info(`[REPAIR] Deleted landing-page documentId=${doc.documentId}`);
    }

    const partnerMap = await importPartners(marsboxEn.partners);
    await upsertLandingPage('en', marsboxEn.landingPage, partnerMap, { overwrite: true });

    await pluginStore.set({ key: REPAIR_KEY, value: true });
    strapi.log.info('[REPAIR] Landing page rebuilt cleanly from seed source.');
  } catch (error) {
    strapi.log.error('[REPAIR] Landing page repair FAILED:');
    strapi.log.error(error);
  }
}

module.exports = { repairLandingPage };
