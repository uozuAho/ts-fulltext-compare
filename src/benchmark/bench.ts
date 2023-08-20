import { LunrSearch } from '../lunr/lunrSearch';
import { glob } from 'glob';
import path from 'path';
import fs from 'fs';
import { MyJsSearch } from '../jssearch/myJsSearch';
import { IIndex } from '../IIndex';
import { setFlagsFromString } from 'v8';
import { runInNewContext } from 'vm';

type IndexBuilder = () => IIndex;

async function runAll() {
    await timeIndexingFiles('lunr', () => new LunrSearch());
    await timeIndexingFiles('jssearch', () => new MyJsSearch());
}

async function timeIndexingFiles(name: string, buildIndex: IndexBuilder) {
    let index: IIndex;

    for (let i = 0; i < 5; i++) {
        forceGc();
        index = buildIndex();

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

function forceGc() {
    const gc = runInNewContext('gc');
    gc();
}

setFlagsFromString('--expose_gc');

runAll().then(() => console.log('done'));
