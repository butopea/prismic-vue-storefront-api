// Add/remove a 'prismic_' prefix from the ElasticSearch field names to prevent mapping mixup with the default mappings (e.g. id)
const prismicFieldPrefix = (obj, remove = false) => Object
  .keys(obj)
  .reduce((acc, key) => ({
    ...acc,
    ...{ ['prismic_' + key]: obj[key] }
  }), {});

export { prismicFieldPrefix }
