"use strict";

const fs = require("fs-extra");
const path = require("path");
const mime = require("mime-types");
const marsboxEn = require("../data/marsbox-en.json");
const marsboxTr = require("../data/marsbox-tr.json");

const MEDIA_FIELDS = {
  "sections.hero": ["backgroundVideo", "backgroundImage"],
  "sections.statement": ["image"],
  "sections.image-banner": ["image"],
  "sections.stats": ["image"],
};

async function shouldImportMarsboxSeed() {
  const pluginStore = strapi.store({
    environment: strapi.config.environment,
    type: "type",
    name: "setup",
  });
  const hasRun = await pluginStore.get({ key: "marsboxSeedHasRun" });
  if (!hasRun) {
    await pluginStore.set({ key: "marsboxSeedHasRun", value: true });
    return true;
  }
  return false;
}

function getFileSizeInBytes(filePath) {
  const stats = fs.statSync(filePath);
  return stats.size;
}

function getFileData(fileName) {
  const filePath = path.join("data", "uploads", fileName);
  const size = getFileSizeInBytes(filePath);
  const ext = fileName.split(".").pop();
  const mimeType = mime.lookup(ext || "") || "";

  return {
    filepath: filePath,
    originalFileName: fileName,
    size,
    mimetype: mimeType,
  };
}

async function uploadFile(file, name) {
  return strapi
    .plugin("upload")
    .service("upload")
    .upload({
      files: file,
      data: {
        fileInfo: {
          alternativeText: `Volaso reference asset: ${name}`,
          caption: name,
          name,
        },
      },
    });
}

async function checkFileExistsBeforeUpload(files) {
  const existingFiles = [];
  const uploadedFiles = [];

  for (const fileName of files) {
    const baseName = fileName.replace(/\..*$/, "");
    const fileWhereName = await strapi.query("plugin::upload.file").findOne({
      where: { name: baseName },
    });

    if (fileWhereName) {
      existingFiles.push(fileWhereName);
    } else {
      const fileData = getFileData(fileName);
      const [file] = await uploadFile(fileData, baseName);
      uploadedFiles.push(file);
    }
  }

  const allFiles = [...existingFiles, ...uploadedFiles];
  return allFiles.length === 1 ? allFiles[0] : allFiles;
}

async function uploadMediaField(fileName) {
  if (!fileName) return null;
  return checkFileExistsBeforeUpload([fileName]);
}

async function resolveSections(sections, partnerMap) {
  const resolved = [];

  for (const section of sections) {
    const copy = { ...section };
    const mediaFields = MEDIA_FIELDS[section.__component] || [];

    for (const field of mediaFields) {
      if (copy[field]) {
        copy[field] = await uploadMediaField(copy[field]);
      }
    }

    if (section.__component === "sections.feature-grid" && copy.features) {
      copy.features = await Promise.all(
        copy.features.map(async (feature) => {
          const featureCopy = { ...feature };
          if (featureCopy.image) {
            featureCopy.image = await uploadMediaField(featureCopy.image);
          }
          return featureCopy;
        }),
      );
    }

    if (section.__component === "sections.partners" && copy.partnerKeys) {
      copy.partners = copy.partnerKeys
        .map((key) => partnerMap[key])
        .filter(Boolean);
      delete copy.partnerKeys;
    }

    resolved.push(copy);
  }

  return resolved;
}

async function resolveSeo(seo) {
  if (!seo) return seo;
  const resolved = { ...seo };
  if (resolved.shareImage) {
    resolved.shareImage = await uploadMediaField(resolved.shareImage);
  }
  return resolved;
}

async function importPartners(partners) {
  const partnerMap = {};

  for (const partner of partners) {
    const existing = await strapi.documents("api::partner.partner").findFirst({
      filters: { name: { $eq: partner.name } },
    });

    const logo = partner.logo ? await uploadMediaField(partner.logo) : null;
    const data = {
      name: partner.name,
      url: partner.url,
      logo,
    };

    if (existing) {
      await strapi.documents("api::partner.partner").update({
        documentId: existing.documentId,
        data,
      });
      await strapi.documents("api::partner.partner").publish({
        documentId: existing.documentId,
      });
      partnerMap[partner.name] = existing.documentId;
    } else {
      const created = await strapi.documents("api::partner.partner").create({
        data,
      });
      await strapi.documents("api::partner.partner").publish({
        documentId: created.documentId,
      });
      partnerMap[partner.name] = created.documentId;
    }
  }

  return partnerMap;
}

async function upsertGlobal(locale, data, { overwrite = false } = {}) {
  const existing = await strapi
    .documents("api::global.global")
    .findFirst({ locale });

  if (existing && !overwrite) {
    strapi.log.info(
      `Seed: global (${locale}) already exists, keeping editor content (no overwrite).`,
    );
    return existing.documentId;
  }

  const entry = { ...data };
  if (entry.favicon) entry.favicon = await uploadMediaField(entry.favicon);
  if (entry.logo) entry.logo = await uploadMediaField(entry.logo);
  if (entry.defaultSeo) entry.defaultSeo = await resolveSeo(entry.defaultSeo);

  if (existing) {
    await strapi.documents("api::global.global").update({
      documentId: existing.documentId,
      locale,
      data: entry,
    });
    return existing.documentId;
  }

  const created = await strapi.documents("api::global.global").create({
    locale,
    data: entry,
  });
  return created.documentId;
}

async function upsertLandingPage(
  locale,
  landingData,
  partnerMap,
  { overwrite = false } = {},
) {
  const existing = await strapi
    .documents("api::landing-page.landing-page")
    .findFirst({
      locale,
    });

  if (existing && !overwrite) {
    strapi.log.info(
      `Seed: landing page (${locale}) already exists, keeping editor content (no overwrite).`,
    );
    return existing.documentId;
  }

  const sections = await resolveSections(landingData.sections, partnerMap);
  const seo = await resolveSeo(landingData.seo);
  const data = { sections, seo };

  let documentId;

  if (existing) {
    await strapi.documents("api::landing-page.landing-page").update({
      documentId: existing.documentId,
      locale,
      data,
    });
    documentId = existing.documentId;
  } else {
    const created = await strapi
      .documents("api::landing-page.landing-page")
      .create({
        locale,
        data,
      });
    documentId = created.documentId;
  }

  await strapi.documents("api::landing-page.landing-page").publish({
    documentId,
    locale,
  });

  return documentId;
}

async function importEnglishSeed(partnerMap, { overwrite = false } = {}) {
  await upsertGlobal("en", marsboxEn.global, { overwrite });
  await upsertLandingPage("en", marsboxEn.landingPage, partnerMap, {
    overwrite,
  });
}

async function importTurkishSeed(
  partnerMap,
  enGlobal,
  { overwrite = false } = {},
) {
  const trGlobal = {
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

  await upsertGlobal("tr", trGlobal, { overwrite });
  await upsertLandingPage("tr", marsboxTr.landingPage, partnerMap, {
    overwrite,
  });
}

async function importMarsboxSeed({ force = false, withTr = false } = {}) {
  if (!force && !(await shouldImportMarsboxSeed())) {
    strapi.log.info(
      "Marsbox seed already imported. Run npm run seed:marsbox -- --force to reimport.",
    );
    return;
  }

  if (force) {
    const pluginStore = strapi.store({
      environment: strapi.config.environment,
      type: "type",
      name: "setup",
    });
    await pluginStore.set({ key: "marsboxSeedHasRun", value: true });
  }

  strapi.log.info("Importing Marsbox / Volaso English landing page seed...");

  const partnerMap = await importPartners(marsboxEn.partners);
  await importEnglishSeed(partnerMap, { overwrite: force });

  if (withTr) {
    strapi.log.info("Importing Turkish localizations...");
    await importTurkishSeed(partnerMap, marsboxEn.global, { overwrite: force });
  }

  strapi.log.info("Marsbox seed import complete.");
}

module.exports = { importMarsboxSeed, importEnglishSeed, importPartners };
