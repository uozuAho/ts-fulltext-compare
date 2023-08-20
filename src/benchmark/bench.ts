import { LunrSearch } from '../lunr/lunrSearch';
import { glob } from 'glob';
import path from 'path';
import fs from 'fs';
import { MyJsSearch } from '../jssearch/myJsSearch';
import { IIndex } from '../IIndex';

type IndexBuilder = () => IIndex;

async function runAll() {
    await timeIndexingFiles('lunr', () => new LunrSearch());
    await timeIndexingFiles('jssearch', () => new MyJsSearch());
}

async function timeIndexingFiles(name: string, buildIndex: IndexBuilder) {
    for (let i = 0; i < 5; i++) {
        const index = buildIndex();

    const mdFiles = glob
        .sync('../../data/10000files/10000 markdown files/*.md', { cwd: __dirname })
        .map(f => path.resolve(`${__dirname}/${f}`))
        .slice(0, 1000);

    let timeStart = Date.now();
    for (const mdFile of mdFiles) {
        const text = fs.readFileSync(mdFile, 'utf8');
        index.indexFile(mdFile, text, []);
    }
    let timeEnd = Date.now();
    console.log(`${name}: Indexing ${mdFiles.length} files took ${timeEnd - timeStart}ms`);
    console.log(process.memoryUsage());

    timeStart = Date.now();
    const results = (await index.search('Serpent room')).slice(0, 10);
    timeEnd = Date.now();
    console.log(`${name}: Searching ${1000} files took ${timeEnd - timeStart}ms`);
    }
}

// import { setFlagsFromString } from 'v8';
// import { runInNewContext } from 'vm';

// setFlagsFromString('--expose_gc');
// const gc = runInNewContext('gc'); // nocommit
// gc();

runAll().then(() => console.log('done'));
