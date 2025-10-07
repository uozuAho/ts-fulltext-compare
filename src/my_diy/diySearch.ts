import { IDocument, IIndexlessFts } from "../interfaces";
import { glob } from 'glob';
import fs from 'fs';

class DocStats {
    public AvgDocLen = 0;

    // path: term: count
    private _termCounts: Map<string, Map<string, number>> = new Map();
    private _docLens: Map<string, number> = new Map();
    // term: numDocs
    private _docCounts: Map<string, number> = new Map();

    public docPaths() {
        return this._termCounts.keys();
    }

    public docTermCount(path: string, term: string) {
        return this._termCounts.get(path)?.get(term) || 0;
    }

    public containsDoc(path: string) {
        return this._termCounts.get(path) != undefined;
    }

    public numDocsContaining(term: string) {
        return this._docCounts.get(term) || 0;
    }

    public addTermCount(doc: string, term: string, count: number) {
        if (!this._termCounts.has(doc)) {
            this._termCounts.set(doc, new Map());
        }
        const counts = this._termCounts.get(doc);
        counts?.set(term, (counts.get(term) || 0) + count);

        // todo: prevent double counting?
        this._docCounts.set(term, (this._docCounts.get(term) || 0) + 1)
    }

    public removeDoc(path: string) {
        this._termCounts.delete(path);
    }

    public setDocLen(path: string, len: number) {
        this._docLens.set(path, len);
    }

    public docLen(path: string) {
        const len = this._docLens.get(path);
        if (len === undefined) {
            throw new Error(`doc len not stored: ${path}`);
        }
        return len;
    }
}

class Query {
    constructor(
        public mustHave: string[],
        public exclude: string[],
        public other: string[]
    ) {}
}

function parseQuery(query: string) {
    let queryTerms2 = query.split(' ');
    let mustIncludeTerms = queryTerms2
        .filter(t => t.startsWith("+"))
        .map(t => t.substring(1));
    let mustNotIncludeTerms = queryTerms2
        .filter(t => t.startsWith("-"))
        .map(t => t.substring(1));
    let plainTerms = queryTerms2
        .filter(t => !t.startsWith("+") && !t.startsWith("-"))
        .filter(t => !isStopWord(t))
        .map(t => crappyStem(t));

    return new Query(mustIncludeTerms, mustNotIncludeTerms, plainTerms);
}

export class MyDiySearch implements IIndexlessFts {
    public searchPath = async (path: string, query: string) => {
        const files = glob.sync(`${path}/*.md`);
        const docs: IDocument[] = [];
        for (const file of files) {
            const text = fs.readFileSync(file, 'utf8');
            docs.push({path: file, text});
        }
        return this.searchDocs(docs, query);
    };

    public searchDocs = async (docs: IDocument[], queryStr: string) => {
        const k1 = 1.5;
        const b = 0.75;

        const query = parseQuery(queryStr);

        var docStats = buildDocStats(docs, query);

        const N = docs.length;
        const paths = Array.from(docStats.docPaths());
        const myScores: number[] = [];

        // rank by bm25
        for (const path of paths) {
            let score = 0;
            const myTerms = query.mustHave.concat(query.other);
            for (const term of myTerms) {
                const f = docStats.docTermCount(path, term);
                if (f === 0) continue;
                const df = docStats.numDocsContaining(term);
                const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
                const denom = f + k1 * (1 - b + b * (docStats.docLen(path) / docStats.AvgDocLen));
                score += idf * (f * (k1 + 1)) / denom;
            }
            myScores.push(score);
        }
        const myRanked = paths
            .map((path, i) => ({ path, score: myScores[i] }))
            .filter(d => d.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(d => d.path);

        return myRanked;
    }
}

function buildDocStats(docs: IDocument[], query: Query) {
    const stats = new DocStats();
    let docLenSum = 0;

    for (const doc of docs) {
        docLenSum += doc.text.length;
        let excludeDoc = false;
        for (const term of query.mustHave) {
            const regex = new RegExp(`${term}`, 'g');
            const count = (doc.text.match(regex) || []).length;
            if (count > 0) {
                stats.addTermCount(doc.path, term, count);
            } else {
                excludeDoc = true;
                stats.removeDoc(doc.path);
                break;
            }
        }
        if (excludeDoc) {
            break;
        }
        for (const term of query.exclude) {
            if (doc.text.includes(term)) {
                stats.removeDoc(doc.path);
                excludeDoc = true;
                break;
            }
        }
        if (excludeDoc) {
            break;
        }
        for (const term of query.other) {
            const regex = new RegExp(`${term}`, 'g');
            const count = (doc.text.match(regex) || []).length;
            if (count > 0) {
                stats.addTermCount(doc.path, term, count);
            }
        }
        if (stats.containsDoc(doc.path)) {
            stats.setDocLen(doc.path, doc.text.length);
        }
    }
    stats.AvgDocLen = docLenSum / docs.length;

    return stats;
}

function crappyStem(word: string) {
    if (word.endsWith('ing') || word.endsWith('ies')) {
        return word.substring(0, word.length - 3);
    }
    if (word.endsWith('e') || word.endsWith('y')) {
        return word.substring(0, word.length - 1);
    }
    return word;
}

let _stopwordMap: Set<string>;

function isStopWord(word: string) {
    if (!_stopwordMap) {
        _stopwordMap = new Set();
        for (const word of stopWords) {
            _stopwordMap.add(word);
        }
    }
    return _stopwordMap.has(word);
}

// copied from lunr.js
const stopWords = [
  'a',
  'able',
  'about',
  'across',
  'after',
  'all',
  'almost',
  'also',
  'am',
  'among',
  'an',
  'and',
  'any',
  'are',
  'as',
  'at',
  'be',
  'because',
  'been',
  'but',
  'by',
  'can',
  'cannot',
  'could',
  'dear',
  'did',
  'do',
  'does',
  'either',
  'else',
  'ever',
  'every',
  'for',
  'from',
  'get',
  'got',
  'had',
  'has',
  'have',
  'he',
  'her',
  'hers',
  'him',
  'his',
  'how',
  'however',
  'i',
  'if',
  'in',
  'into',
  'is',
  'it',
  'its',
  'just',
  'least',
  'let',
  'like',
  'likely',
  'may',
  'me',
  'might',
  'most',
  'must',
  'my',
  'neither',
  'no',
  'nor',
  'not',
  'of',
  'off',
  'often',
  'on',
  'only',
  'or',
  'other',
  'our',
  'own',
  'rather',
  'said',
  'say',
  'says',
  'she',
  'should',
  'since',
  'so',
  'some',
  'than',
  'that',
  'the',
  'their',
  'them',
  'then',
  'there',
  'these',
  'they',
  'this',
  'tis',
  'to',
  'too',
  'twas',
  'us',
  'wants',
  'was',
  'we',
  'were',
  'what',
  'when',
  'where',
  'which',
  'while',
  'who',
  'whom',
  'why',
  'will',
  'with',
  'would',
  'yet',
  'you',
  'your'
];
