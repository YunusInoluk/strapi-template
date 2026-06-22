'use strict';

function isMediaConnect(value) {
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).length === 1 &&
    typeof value.id === 'number'
  );
}

function isRelationMutation(value) {
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    ('connect' in value || 'disconnect' in value || 'set' in value)
  );
}

function looksLikeMedia(value) {
  return 'url' in value || 'mime' in value || 'mimeType' in value || 'provider' in value;
}

function stripComponentIds(value) {
  if (value == null) return;

  if (Array.isArray(value)) {
    for (const item of value) {
      stripComponentIds(item);
    }
    return;
  }

  if (typeof value !== 'object') return;

  if (isRelationMutation(value) || isMediaConnect(value)) {
    return;
  }

  const isDynamicZoneItem = typeof value.__component === 'string';
  const hasNestedFields = Object.keys(value).some(
    (key) => key !== 'id' && key !== '__component',
  );
  const shouldStripId =
    typeof value.id === 'number' &&
    !looksLikeMedia(value) &&
    (isDynamicZoneItem || hasNestedFields);

  if (shouldStripId) {
    delete value.id;
  }

  for (const [key, nested] of Object.entries(value)) {
    if (key === 'id') continue;
    stripComponentIds(nested);
  }
}

module.exports = { stripComponentIds };
