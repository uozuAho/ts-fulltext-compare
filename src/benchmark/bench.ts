import { LunrSearch } from '../lunr/lunrSearch';
import { glob } from 'glob';
import path from 'path';
import fs from 'fs';
import { MyJsSearch } from '../jssearch/myJsSearch';

async function runBench() {
    await lunrIndexBench();
    jsSearchIndexBench();
}

async function lunrIndexBench() {
    const lunrSearch = new LunrSearch();

    const mdFiles = glob
        .sync('../../data/10000files/10000 markdown files/*.md', { cwd: __dirname })
        .map(f => path.resolve(`${__dirname}/${f}`));

    let timeStart = Date.now();
    for (const mdFile of mdFiles.slice(0, 1000)) {
        const text = fs.readFileSync(mdFile, 'utf8');
        lunrSearch.indexFile(mdFile, text, []);
    }
    lunrSearch.finalise();
    let timeEnd = Date.now();
    console.log(`lunr: Indexing ${1000} files took ${timeEnd - timeStart}ms`);
    console.log(process.memoryUsage());

    timeStart = Date.now();
    const asdf = (await lunrSearch.search('Serpent room')).slice(0, 10);
    timeEnd = Date.now();
    console.log(asdf);
    console.log(`lunr: Searching ${1000} files took ${timeEnd - timeStart}ms`);
}

function jsSearchIndexBench() {
    const jss = new MyJsSearch();

    const mdFiles = glob
        .sync('../../data/10000files/10000 markdown files/*.md', { cwd: __dirname })
        .map(f => path.resolve(`${__dirname}/${f}`))
        .slice(0, 1000);

    let timeStart = Date.now();
    for (const mdFile of mdFiles) {
        const text = fs.readFileSync(mdFile, 'utf8');
        jss.indexFile(mdFile, text, []);
    }
    let timeEnd = Date.now();
    console.log(`jssearch: Indexing ${1000} files took ${timeEnd - timeStart}ms`);
    console.log(process.memoryUsage());

    timeStart = Date.now();
    const asdf = jss.search('Serpent room').slice(0, 10);
    timeEnd = Date.now();
    console.log(asdf);
    console.log(`jssearch: Searching ${1000} files took ${timeEnd - timeStart}ms`);
}

runBench().then(() => console.log('done'));
