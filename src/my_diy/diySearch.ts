import { IDocument, IIndexlessFts } from "../interfaces";
import { glob } from 'glob';
import fs from 'fs';

export class MyDiySearch implements IIndexlessFts {
    public searchPath = async (path: string, query: string) => {
        const files = glob.sync(`${path}/*.md`);
        const results = [];
        for (const file of files) {
            const text = fs.readFileSync(file, 'utf8');
            const r = await this.searchText(text, query);
            if (r.length > 0) {
                results.push(file);
            }
        }
        return results;
    };

    // todo: BM25 implemented by chatGPT. passes tests ... is it slow?
    public searchDocs = async (docs: IDocument[], query: string) => {
        // BM25 parameters
        const k1 = 1.5;
        const b = 0.75;

        // Preprocess query terms (use same stemming/stopword logic as searchText)
        let queryTerms = query.split(' ')
            .filter(t => !t.startsWith("+") && !t.startsWith("-"))
            .filter(t => !isStopWord(t))
            .map(t => crappyStem(t));
        if (queryTerms.length === 0) return [];

        // Build document term frequencies and lengths
        const docTermFreqs: Array<{[term: string]: number}> = [];
        const docLengths: number[] = [];
        let avgDocLen = 0;
        for (const doc of docs) {
            const terms = doc.text
                .split(/\W+/)
                .map(t => crappyStem(t.toLowerCase()))
                .filter(t => t && !isStopWord(t));
            const tf: {[term: string]: number} = {};
            for (const term of terms) {
                tf[term] = (tf[term] || 0) + 1;
            }
            docTermFreqs.push(tf);
            docLengths.push(terms.length);
            avgDocLen += terms.length;
        }
        avgDocLen = docs.length > 0 ? avgDocLen / docs.length : 0;

        // Compute document frequencies for each query term
        const docFreq: {[term: string]: number} = {};
        for (const term of queryTerms) {
            docFreq[term] = docs.reduce((acc, _, i) => acc + (docTermFreqs[i][term] ? 1 : 0), 0);
        }

        // Compute BM25 scores
        const N = docs.length;
        const scores: number[] = [];
        for (let i = 0; i < docs.length; ++i) {
            let score = 0;
            for (const term of queryTerms) {
                const f = docTermFreqs[i][term] || 0;
                if (f === 0) continue;
                const df = docFreq[term] || 0;
                const idf = Math.log(1 + (N - df + 0.5) / (df + 0.5));
                const denom = f + k1 * (1 - b + b * (docLengths[i] / avgDocLen));
                score += idf * (f * (k1 + 1)) / denom;
            }
            scores.push(score);
        }

        // Sort docs by score (descending), filter out zero scores
        const ranked = docs
            .map((doc, i) => ({ path: doc.path, score: scores[i] }))
            .filter(d => d.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(d => d.path);
        return ranked;
    }

    public searchText = (text: string, query: string) => {
        let queryTerms = query.split(' ');

        let mustIncludeTerms = queryTerms
            .filter(t => t.startsWith("+"))
            .map(t => t.substring(1));

        let mustNotIncludeTerms = queryTerms
            .filter(t => t.startsWith("-"))
            .map(t => t.substring(1));

        let plainTerms = queryTerms
            .filter(t => !t.startsWith("+") && !t.startsWith("-"))
            .filter(t => !isStopWord(t))
            .map(t => crappyStem(t));

        for (const term of mustNotIncludeTerms) {
            if (text.includes(term)) {
                return Promise.resolve([]);
            }
        }

        for (const term of mustIncludeTerms) {
            if (!text.includes(term)) {
                return Promise.resolve([]);
            }
        }

        let foundAnyPlainTerms = false;
        for (const term of plainTerms) {
            if (text.includes(term)) {
                foundAnyPlainTerms = true;
                break;
            }
        }

        if (mustIncludeTerms.length > 0 || foundAnyPlainTerms) {
            return Promise.resolve(["dummyPath"]);
        }

        // todo: this function doesn't need to be async
        return Promise.resolve([]);
    }
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
