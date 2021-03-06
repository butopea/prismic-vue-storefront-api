# Vue Storefront API Prismic Extension

**[** WORK IN PROGRESS **]**

This is the Vue Storefront API part (extension) of the Prismic integration. It requires the [Vue Storefront counterpart (module)](https://github.com/butopea/prismic-vue-storefront) to work.

## Data Flow

![](docs/assets/dataflow.png)

## Features (Vue Storefront API)

- [X] Public and private (via access tokens) API support
- [X] Webhook sync callback support (on publish)
- [X] ElasticSearch data cache
- [X] Content retrieval based on ID/UID, custom types, tags, filters, and languages
- [ ] Image caching
- [ ] CLI manual sync script
## Installation (Vue Storefront API)

Run this command in the VSF API root folder to install the Prismic extension:

```shell script
git submodule add git@github.com:butopea/prismic-vue-storefront-api.git src/api/extensions/prismic
```
Within your config file (config/local.json):

Add Prismic to the `registeredExtensions` list to activate it:

```json
{
  ...
  "registeredExtensions": {
    ...
    "prismic"
  }
}
```


Add the Prismic extension settings to the `extensions` list:

```json
{
  ...
  "extensions": {
    ...
    "prismic": {
      "apiEndpoint": "https://<YOUR_PRISMIC_REPO>.prismic.io/api/v2",
      "accessToken": "",
      "webhookSecret": "",
      "indexToLocale": [
        {
          "index": "vue_storefront_catalog",
          "language": "en-gb"
        }
      ],
      "syncPageSize": 20
    }
  }
}
...
```

Remember to add the following mappings to the `prismic` type in your ElasticSearch importer:

```javascript
db.indices.putMapping({
    index: indexName,
    type: "prismic",
    body: {
      properties: {
        prismic_uid: { type: "keyword" },
        prismic_type: { type: "keyword" },
        prismic_tags: { type: "keyword" }
      }
    }
})
```

You also need to add the `prismic` type in https://github.com/DivanteLtd/vue-storefront/blob/f4a37fb2a256e34152ce89b8e43219b94f91090a/core/lib/search/adapter/api/searchAdapter.ts#L193

```
this.registerEntityType('prismic', {
      queryProcessor: (query) => {
        // function that can modify the query each time before it's being executed
        return query
      },
      resultProcessor: (resp, start, size) => {
        return this.handleResult(resp, 'prismic', start, size)
      }
    })
```

## Configuration explanation

* `apiEndpoint`
  - Name of your Prismic repository (keep the rest of the URL the same, especially `/api/v2`).
* `accessToken`
  - If you have set up your Prismic repository with a private API, you need to add a new permanent access token and set it here.
* `webhookSecret`
  - The secret passphrase sent by Prismic with each webhook callback.
* `indexToLocale`
  - Contains a mapping of each ElasticSearch index to its document language.
* `syncPageSize`
  - Number of pages to retrieve per request during the sync (default: `20`, maximum: `100`)

## Sync script

To manually sync the database, run the following command in Vue Storefront API's root directory:

```shell script
node src/api/extensions/prismic/scripts/sync.js
```

## Credits

Made with ❤ by [Butopêa](https://butopea.com)

Based on:

* https://github.com/kodbruket/vsf-storyblok-sync
* https://github.com/Agence-DnD/vue-storefront-api-prismic-connector
* https://github.com/BartoszLiburski/vsf-prismic-api

## Support

Please ask your questions regarding this extension on Vue Storefront's Slack https://vuestorefront.slack.com/ You can join via [this invitation link]((https://join.slack.com/t/vuestorefront/shared_invite/enQtNTAwODYzNzI3MjAzLWFkZjc0YjVjODA1Y2I2MTdlNmM0NThjY2M5MzgzN2U2NzE4YmE2YzA4YTM0MTY3OWQzZjBhMjBlZDhmYjAyNGI)).

## License

This extension is completely free and released under the MIT License.
