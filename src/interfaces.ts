export interface IIndexedFts {
    indexFile: (path: string, text: string, tags: string[]) => void;
    search: (query: string) => Promise<string[]>;
}

export interface IDocument {
    path: string;
    text: string;
}

export interface IIndexlessFts {
    searchPath: (path: string, query: string) => Promise<string[]>;
    searchDocs: (docs: IDocument[], query: string) => Promise<string[]>;
}

export function isIndexedFts(fts: IIndexedFts | IIndexlessFts) {
    return 'indexFile' in fts;
}

export function asIIndexedFts(fts: IIndexedFts | IIndexlessFts) {
    if (!isIndexedFts(fts)) {
        throw new Error(`${fts} is not an IIndexedFts`);
    }
    return fts as IIndexedFts;
}

export function asIIndexlessFts(fts: IIndexedFts | IIndexlessFts) {
    if (isIndexedFts(fts)) {
        throw new Error(`${fts} is an IIndexedFts`);
    }
    return fts as IIndexlessFts;
}
