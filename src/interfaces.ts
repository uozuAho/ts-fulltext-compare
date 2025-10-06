export interface IIndexedFts {
    indexFile: (path: string, text: string, tags: string[]) => void;
    search: (query: string) => Promise<string[]>;
}

export interface IIndexlessFts {
    // todo: add ability to search all files
    search: (text: string, query: string) => Promise<string[]>;
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
