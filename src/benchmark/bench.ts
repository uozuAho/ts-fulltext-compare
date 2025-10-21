import { LunrSearch } from '../lunr/lunrSearch';
import { glob } from 'glob';
import path from 'path';
import fs from 'fs';
import { MyJsSearch } from '../jssearch/myJsSearch';
import { IIndexedFts, IIndexlessFts, isIndexedFts } from '../interfaces';
import { setFlagsFromString } from 'v8';
import { runInNewContext } from 'vm';
import { MyMiniSearch } from '../minisearch/myMiniSearch';
import { MyFts } from '../my_diy/myFts';

type FtsBuilder = () => IIndexedFts | IIndexlessFts;

async function runAll(filesDir: string) {
    await benchmark('lunr', () => new LunrSearch(), filesDir);
    await benchmark('myFts', () => new MyFts(), filesDir);

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
    buildFts: FtsBuilder,
    filesDir: string,
    numRuns: number = 5
) {
    let fts: IIndexedFts | IIndexlessFts | undefined;
    const numFilesToIndex = 250;

    const indexTimes: number[] = [];
    const searchTimes: number[] = [];
    const memoryUsages: number[] = [];

    if (isIndexedFts(buildFts())) {
        console.log(`${name} indexing ${numFilesToIndex} files & searching ${numRuns} times...`);
    } else {
        console.log(`${name} searching all files under ${filesDir} ${numRuns} times...`);
    }

    for (let i = 0; i < numRuns; i++) {
        fts = undefined;
        forceGc();
        fts = buildFts();

        const mdFiles = files(filesDir, numFilesToIndex);

        let timeStart = Date.now();
        if (isIndexedFts(fts)) {
            for (const mdFile of mdFiles) {
                const text = fs.readFileSync(mdFile, 'utf8');
                fts.indexFile(mdFile, text, []);
            }
        }
        // quirk: lunr index is only built after the first search runs, so
        // we run it here
        if (isIndexedFts(fts)) {
            await fts.search('');
        }
        let timeEnd = Date.now();
        indexTimes.push(timeEnd - timeStart);
        memoryUsages.push(process.memoryUsage().heapUsed);

        timeStart = Date.now();
        const query = 'Serpent room';
        const results = isIndexedFts(fts)
            ? (await fts.search(query)).slice(0, 10)
            : (await fts.searchPath(filesDir, query)).slice(0, 10);
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
