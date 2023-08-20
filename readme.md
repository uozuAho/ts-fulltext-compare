# Comparison of javascript full text search libraries

# Quick start
- node 18
- npm i
- npm test
- npm run bench

# which to compare?
From the list here: https://github.com/nextapps-de/flexsearch#performance-benchmark-ranking
- lunr: yes, used by note searcher: https://github.com/olivernn/lunr.js
    - last update 2020...
    - lots of downloads on npm
- js-search: yep: https://github.com/bvaughn/js-search
- minisearch: yep: https://github.com/lucaong/minisearch
- flexsearch: yep, but can't figure out how to use in typescript
===========
- elasticlunr: maybe, abandoned? https://www.npmjs.com/package/elasticlunr
    - last update 2019
    - lots of downloads on npm
- wade: maybe, abandoned? https://github.com/kbrsh/wade
    - last update 2019
    - not many downloads on npm
- bulksearch: no, abandoned? https://github.com/nextapps-de/bulksearch
- jsii: no, just a prototype

# todo
- add other libs
- test additional features:
    - add document to index

# maybe
- compare memory usage?
