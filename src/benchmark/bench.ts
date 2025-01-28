import { LunrSearch } from '../lunr/lunrSearch';
import { glob } from 'glob';
import path from 'path';
import fs from 'fs';
import { MyJsSearch } from '../jssearch/myJsSearch';
import { IIndex } from '../IIndex';
import { setFlagsFromString } from 'v8';
import { runInNewContext } from 'vm';
import { MyMiniSearch } from '../minisearch/myMiniSearch';
import { MyLibsearch } from '../libsearch/myLibsearch';

type IndexBuilder = () => IIndex;

async function runAll() {
    await timeIndexingFiles('lunr', () => new LunrSearch());
    await timeIndexingFiles('jssearch', () => new MyJsSearch());
    await timeIndexingFiles('minisearch', () => new MyMiniSearch());
    await timeIndexingFiles('libsearch', () => new MyLibsearch());
}

async function timeIndexingFiles(name: string, buildIndex: IndexBuilder) {
    let index: IIndex | undefined;
    const numRuns = 5;
    const numFilesToIndex = 1000;

    const indexTimes: number[] = [];
    const searchTimes: number[] = [];
    const memoryUsages: number[] = [];

    console.log(`${name} indexing ${numFilesToIndex} files ${numRuns} times...`);

    for (let i = 0; i < numRuns; i++) {
        index = undefined;
        forceGc();
        index = buildIndex();

        const mdFiles = glob
            .sync('../../data/10000files/10000 markdown files/*.md', { cwd: __dirname })
            .map(f => path.resolve(`${__dirname}/${f}`))
            .slice(0, numFilesToIndex);

        let timeStart = Date.now();
        for (const mdFile of mdFiles) {
            const text = fs.readFileSync(mdFile, 'utf8');
            index.indexFile(mdFile, text, []);
        }
        // quirk: lunr index is only built after the first search runs, so
        // we run it here
        await index.search('');
        let timeEnd = Date.now();
        indexTimes.push(timeEnd - timeStart);
        memoryUsages.push(process.memoryUsage().heapUsed);

        timeStart = Date.now();
        const results = (await index.search('Serpent room')).slice(0, 10);
        timeEnd = Date.now();
        searchTimes.push(timeEnd - timeStart);
    }

    const indexTimeAvg = indexTimes.reduce((a, b) => a + b, 0) / numRuns;
    const searchTimeAvg = searchTimes.reduce((a, b) => a + b, 0) / numRuns;
    const memoryUsageAvg = memoryUsages.reduce((a, b) => a + b, 0) / numRuns;

    console.log(`  index time avg: ${indexTimeAvg}ms`);
    console.log(`  search time avg: ${searchTimeAvg}ms`);
    console.log(`  memory usage avg: ${memoryUsageAvg / 1024 / 1024}MB`);
}

function forceGc() {
    const gc = runInNewContext('gc');
    gc();
}

setFlagsFromString('--expose_gc');

runAll().then(() => console.log('done'));
