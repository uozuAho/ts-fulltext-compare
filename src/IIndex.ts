export interface IIndex {
    indexFile: (path: string, text: string, tags: string[]) => void;
    search: (query: string) => Promise<string[]>;
}
