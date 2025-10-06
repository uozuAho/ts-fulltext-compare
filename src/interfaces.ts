export interface IIndexedFts {
    indexFile: (path: string, text: string, tags: string[]) => void;
    search: (query: string) => Promise<string[]>;
}
