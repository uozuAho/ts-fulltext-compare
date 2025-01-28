# Comparison of javascript full text search libraries

# Why?
Lunr doesn't support adding new documents (ie you have to index all files at the
same time), which is making indexing slow in https://github.com/uozuAho/note_searcher

# Status
I stopped working on this once I realised none of the libraries I'm considering
support term presence (eg excluding words).

# Quick start
- use node 18

```sh
npm i
npm test
./get-data.sh
npm run bench
```

# todo
- add libsearch tests
- upon revisit - any new libraries? Does anything support term presence?
    - eg. exclude words in search
- term presence: https://lunrjs.com/guides/searching.html
    - can this be done in minisearch? how does it work?
        - argh its gonna be significant. just use two lunr indexes?
- pass tests for all search libraries
    - need to implement tags, term presence, more
- test additional features:
    - add document to index

# maybe
- try stemming and stop words
- reduce memory usage etc by not storing unnecessary data/ using unnecessary
  features. Eg prefix search
- try to get flexsearch working

# which to compare?
From the list here: https://github.com/nextapps-de/flexsearch#performance-benchmark-ranking

- lunr: yes, used by note searcher: https://github.com/olivernn/lunr.js
    - last update 2020...
    - lots of downloads on npm
- js-search: yep: https://github.com/bvaughn/js-search
- minisearch: yep: https://github.com/lucaong/minisearch
- flexsearch: I want to, but can't figure out how to use it in typescript
- no
    - elasticlunr: maybe, abandoned? https://www.npmjs.com/package/elasticlunr
        - last update 2019
        - lots of downloads on npm
    - wade: maybe, abandoned? https://github.com/kbrsh/wade
        - last update 2019
        - not many downloads on npm
    - bulksearch: no, abandoned? https://github.com/nextapps-de/bulksearch
    - jsii: no, just a prototype
