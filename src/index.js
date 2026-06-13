'use strict';

const seedBootstrap = require('./bootstrap');
const { importMarsboxSeed } = require('./marsbox-seed');

// Public REST permissions required by the Next.js site.
const PUBLIC_PERMISSIONS = {
  'landing-page': ['find'],
  page: ['find', 'findOne'],
  product: ['find', 'findOne'],
  partner: ['find', 'findOne'],
  global: ['find'],
  subscriber: ['create'],
};

async function ensureLocales(strapi) {
  try {
    const localeService = strapi.plugin('i18n').service('locales');
    const locales = await localeService.find();
    const codes = (locales || []).map((locale) => locale.code);

    if (!codes.includes('en')) {
      await localeService.create({ code: 'en', name: 'English (en)' });
      strapi.log.info('i18n: created "en" locale');
    }

    if (!codes.includes('tr')) {
      await localeService.create({ code: 'tr', name: 'Turkish (tr)' });
      strapi.log.info('i18n: created "tr" locale');
    }

    const defaultLocale = locales.find((locale) => locale.isDefault);
    if (!defaultLocale || defaultLocale.code !== 'en') {
      await localeService.setDefaultLocale({ code: 'en' });
      strapi.log.info('i18n: set default locale to "en"');
    }
  } catch (error) {
    strapi.log.error('Failed to ensure locales');
    strapi.log.error(error);
  }
}

async function ensurePublicPermissions(strapi) {
  try {
    const publicRole = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'public' } });
    if (!publicRole) return;

    for (const [api, actions] of Object.entries(PUBLIC_PERMISSIONS)) {
      for (const action of actions) {
        const actionId = `api::${api}.${api}.${action}`;
        const existing = await strapi
          .query('plugin::users-permissions.permission')
          .findOne({ where: { action: actionId, role: publicRole.id } });
        if (!existing) {
          await strapi
            .query('plugin::users-permissions.permission')
            .create({ data: { action: actionId, role: publicRole.id } });
        }
      }
    }
  } catch (error) {
    strapi.log.error('Failed to ensure public permissions');
    strapi.log.error(error);
  }
}

module.exports = {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   */
  register(/* { strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   */
  async bootstrap({ strapi }) {
    await seedBootstrap();
    await importMarsboxSeed({ withTr: false });
    await ensureLocales(strapi);
    await ensurePublicPermissions(strapi);
  },
};
