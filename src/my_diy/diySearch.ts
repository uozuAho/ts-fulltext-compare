import { IIndexlessFts } from "../interfaces";

export class MyDiySearch implements IIndexlessFts {
    public search = (text: string, query: string) => {
        let queryTerms = query.split(' ');

        let mustIncludeTerms = queryTerms
            .filter(t => t.startsWith("+"))
            .map(t => t.substring(1));

        let mustNotIncludeTerms = queryTerms
            .filter(t => t.startsWith("-"))
            .map(t => t.substring(1));

        let plainTerms = queryTerms
            .filter(t => !t.startsWith("+") && !t.startsWith("-"));

        for (const term of mustIncludeTerms) {
            if (!text.includes(term)) {
                return Promise.resolve([]);
            }
        }

        for (const term of mustNotIncludeTerms) {
            if (text.includes(term)) {
                return Promise.resolve([]);
            }
        }

        for (const term of plainTerms) {
            if (text.includes(term)) {
                return Promise.resolve(["dummyPath"]);
            }
        }

        return Promise.resolve([]);
    }
}
