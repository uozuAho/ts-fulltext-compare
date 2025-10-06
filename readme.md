# Comparison of javascript full text search libraries

# Why?
Lunr doesn't support adding new documents (ie you have to index all files at the
same time), which is making indexing slow in https://github.com/uozuAho/note_searcher

# Status
I stopped working on this once I realised none of the libraries I'm considering
support term presence (eg excluding words).

# Quick start
- use node 22

```sh
npm i
npm test
./get-bench-data.sh                     # optional
npm run bench ./data/md10000/files      # run with above data
```

# My test results
AMD Ryzen 5 3600

```
lunr indexing 1000 files 5 times...
  index time avg: 1522.2ms
  search time avg: 2.2ms
  memory usage avg (MB): 296.1
jssearch indexing 1000 files 5 times...
  index time avg: 1062.2ms
  search time avg: 1ms
  memory usage avg (MB): 428.1
minisearch indexing 1000 files 5 times...
  index time avg: 481.8ms
  search time avg: 1.2ms
  memory usage avg (MB): 189.7
```

# todo
- upon revisit - any new libraries? Does anything support term presence?
    - eg. exclude words in search
- test additional features:
    - add document to index

# requirements
For https://github.com/uozuAho/note_searcher
- incremental indexing (or no indexing)
- stemming
- filter stop words
- term presence


# which to compare?
## yes
- lunr: yes, used by note searcher: https://github.com/olivernn/lunr.js
    - bad: last update 2020...
    - good: lots of downloads on npm
    - bad: cannot add/remove docs from index
## maybe
- flexsearch
    - bad: I can't figure out how to use it in typescript
- elasticlunr: maybe, abandoned? https://www.npmjs.com/package/elasticlunr
    - last update 2019
    - lots of downloads on npm
- [tantivy full text search](https://github.com/quickwit-oss/tantivy)
    - compile to wasm, then https://code.visualstudio.com/blogs/2024/05/08/wasm
## no
- libsearch: https://github.com/thesephist/libsearch
    - bad: no term presence
    - bad: import error when testing with jest
- js-search: yep: https://github.com/bvaughn/js-search
    - bad: no term presence
    - bad: not maintained?
- minisearch: yep: https://github.com/lucaong/minisearch
    - bad: no term presence
    - good: can add/remove docs from index
- wade: maybe, abandoned? https://github.com/kbrsh/wade
    - last update 2019
    - not many downloads on npm
- bulksearch: no, abandoned? https://github.com/nextapps-de/bulksearch
- jsii: no, just a prototype
