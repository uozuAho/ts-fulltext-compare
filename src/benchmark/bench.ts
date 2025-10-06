import { LunrSearch } from '../lunr/lunrSearch';
import { glob } from 'glob';
import path from 'path';
import fs from 'fs';
import { MyJsSearch } from '../jssearch/myJsSearch';
import { IIndexedFts } from '../interfaces';
import { setFlagsFromString } from 'v8';
import { runInNewContext } from 'vm';
import { MyMiniSearch } from '../minisearch/myMiniSearch';

type IndexBuilder = () => IIndexedFts;

async function runAll(filesDir: string) {
    await benchmark('lunr', () => new LunrSearch(), filesDir);

    // don't really care about these: they don't have the features i want
    // await benchmark('jssearch', () => new MyJsSearch(), filesDir);
    // await benchmark('minisearch', () => new MyMiniSearch(), filesDir);
}

function files(dir: string, numfiles: number) {
    const absDir = path.resolve(dir);

    return glob
        .sync(`${absDir}/*.md`)
        .map(f => path.resolve(absDir, f))
        .slice(0, numfiles);
}

async function benchmark(
    name: string,
    buildIndex: IndexBuilder,
    filesDir: string
) {
    let index: IIndexedFts | undefined;
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

        const mdFiles = files(filesDir, numFilesToIndex);

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
    console.log(`  memory usage avg (MB): ${(memoryUsageAvg / 1024 / 1024).toFixed(1)}`);
}

function forceGc() {
    const gc = runInNewContext('gc');
    gc();
}

setFlagsFromString('--expose_gc');

if (process.argv.length < 3) {
    console.error("Gimme a dir with text files");
    process.exit(1);
}
const dir = process.argv[2];
runAll(dir).then(() => console.log('done'));
