import errors from "../static/errors";

export const checkConfig = (config) => {
  const requiredConfigFields = ['apiEndpoint', 'cmsPageEntityType', 'cmsBlockEntityType', 'indexToLocale', 'retrieveItemIfNotCached', 'webhookSecret']
  if (!config.prismic) throw new Error(errors.configNotFound)
  for(let configField of requiredConfigFields) if(!Object.keys(config.prismic).includes(configField)) throw new Error(errors.configFieldNotFound + ' (' + configField  + ')')

  return true
}
