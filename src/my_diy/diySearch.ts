import { IIndexlessFts } from "../interfaces";
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
