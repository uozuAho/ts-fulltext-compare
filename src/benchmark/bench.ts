import { LunrSearch } from '../lunr/lunrSearch';
import { glob } from 'glob';
import path from 'path';
import fs from 'fs';

function runBench() {
    const lunrSearch = new LunrSearch();

    const mdFiles = glob
        .sync('../../data/10000files/10000 markdown files/*.md', { cwd: __dirname })
        .map(f => path.resolve(`${__dirname}/${f}`));

    const timeStart = Date.now();
    for (const mdFile of mdFiles.slice(0, 1000)) {
        const text = fs.readFileSync(mdFile, 'utf8');
        lunrSearch.indexFile(mdFile, text, []);
    }
    lunrSearch.finalise();
    const timeEnd = Date.now();

    console.log(`Indexing took ${timeEnd - timeStart}ms`);
}

runBench();
