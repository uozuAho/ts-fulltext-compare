import MiniSearch from 'minisearch';
import { IIndex } from '../IIndex';

export class MyMiniSearch implements IIndex {
    private _index: MiniSearch<any>;

    constructor() {
        this._index = new MiniSearch({
            fields: ['path', 'text', 'tags'],
            storeFields: ['path']
        });
    }

    public indexFile = (path: string, text: string, tags: string[]) => {
        this._index.add({ path, text, tags });
    }

    public search = (query: string) => {
        return Promise.resolve(this._index.search(query).map(r => r.path));
    }
}
