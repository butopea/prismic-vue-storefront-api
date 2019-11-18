# Vue Storefront API Prismic Extension

This is the Vue Storefront API part (extension) of the Prismic integration. It requires the [Vue Storefront counterpart (module)](https://github.com/butopea/prismic-vue-storefront) to work.  

## Data Flow:

![](docs/assets/dataflow.png)

## Features:

- [ ] Dynamic and prefixed URLs (via [mapping fallback](https://github.com/kodbruket/vsf-mapping-fallback/))
- [ ] Server-side rendering (SSR)
- [ ] Preview mode (non-cached, direct data retrieval)
- [ ] In-website edit button
- [ ] Webhook sync callback support (on publish)
- [ ] CLI sync script (cronjob)
- [ ] Queued sync (via Kue)
- [ ] ElasticSearch data cache
- [ ] Slices field support for dynamic page layouts
- [ ] Content retrieval based on ID/UID, custom types, tags, filters, and languages
- [ ] Document search

## Installation (Vue Storefront API):

Run this command in the VSF API root folder to install the Prismic extension: 

```shell script
git submodule add git@github.com:butopea/prismic-vue-storefront-api.git src/api/extensions/
```

Add the following block to your configuration file (config/local.json):

```json
"prismic": {
  "apiEndpoint": "https://<YOUR_PRISMIC_REPO>.prismic.io/api/v2",
  "retrievePageIfNotCached": true
}
```

## Configuration explanation
* apiEndpoint
  - Name of your Prismic repo (keep the rest of the URL the same, specially `/api/v2`).
* retrievePageIfNotCached
  - If the requested page is not cached in ElasticSearch, the extension will attempt to load it from Prismic and store it in the database.
## Credits

Made with ❤ by [Butopêa](https://butopea.com)

## Support

Please ask your questions regarding this extension on Vue Storefront's Slack https://vuestorefront.slack.com/ You can join via [this invitation link]((https://join.slack.com/t/vuestorefront/shared_invite/enQtNTAwODYzNzI3MjAzLWFkZjc0YjVjODA1Y2I2MTdlNmM0NThjY2M5MzgzN2U2NzE4YmE2YzA4YTM0MTY3OWQzZjBhMjBlZDhmYjAyNGI)).

## License

This extension is completely free and released under the MIT License.
