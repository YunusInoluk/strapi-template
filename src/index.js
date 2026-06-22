'use strict';

const seedBootstrap = require('./bootstrap');
const { importMarsboxSeed } = require('./marsbox-seed');
const { stripComponentIds } = require('./utils/strip-component-ids');
const { repairLandingPage } = require('./repair-landing-page');

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
  register({ strapi }) {
    const stripDisabled = process.env.DISABLE_STRIP_MIDDLEWARE === '1';
    if (stripDisabled) {
      strapi.log.info('[TRACE] stripComponentIds DISABLED via env flag (tracing still on).');
    }

    const WATCHED = new Set([
      'api::landing-page.landing-page',
      'api::global.global',
    ]);

    strapi.documents.use(async (context, next) => {
      const watched =
        WATCHED.has(context.uid) &&
        ['create', 'update', 'publish'].includes(context.action);

      if (watched) {
        let dataDump = '(no data)';
        try {
          dataDump = JSON.stringify(context.params?.data ?? null).slice(0, 1800);
        } catch (e) {
          dataDump = `(unserializable: ${e.message})`;
        }
        strapi.log.info(
          `[WRITE-TRACE-IN] ${context.uid} action=${context.action} ` +
            `status=${context.params?.status ?? '-'} locale=${context.params?.locale ?? '-'} ` +
            `strip=${stripDisabled ? 'off' : 'on'} data=${dataDump}`,
        );
      }

      if (!stripDisabled && ['create', 'update'].includes(context.action) && context.params?.data) {
        stripComponentIds(context.params.data);
      }

      try {
        const result = await next();
        if (watched) {
          strapi.log.info(`[WRITE-TRACE-OK] ${context.uid} action=${context.action} succeeded.`);
        }
        return result;
      } catch (err) {
        if (watched) {
          strapi.log.error(
            `[WRITE-TRACE-ERR] ${context.uid} action=${context.action} -> ${err.message}`,
          );
        }
        throw err;
      }
    });
  },

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   */
  async bootstrap({ strapi }) {
    await seedBootstrap();
    await importMarsboxSeed({ withTr: false });
    await ensureLocales(strapi);
    await ensurePublicPermissions(strapi);
    await repairLandingPage();
  },
};
