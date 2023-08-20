import { Search } from 'js-search';

export class MyJsSearch {
    private _index: Search;

    constructor() {
        this._index = new Search('path');
        this._index.addIndex('text');
        this._index.addIndex('tags');
    }

    public indexFile = (path: string, text: string, tags: string[]) => {
        this._index.addDocument({ path, text, tags });
    }

    public search = (query: string) => {
        return this._index.search(query).map((r: any) => r.path);
    }
}
