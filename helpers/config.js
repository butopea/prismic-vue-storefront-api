import errors from "../static/errors";

export const checkConfig = (config) => {
  const requiredConfigFields = ['apiEndpoint', 'indexToLocale', 'webhookSecret']
  if (!config.extensions.prismic) throw new Error(errors.configNotFound)
  for(let configField of requiredConfigFields) if(!Object.keys(config.extensions.prismic).includes(configField)) throw new Error(errors.configFieldNotFound + ' (' + configField  + ')')

  return true
}
