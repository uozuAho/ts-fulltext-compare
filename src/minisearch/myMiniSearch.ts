import MiniSearch from 'minisearch';
import { IIndex } from '../IIndex';

export class MyMiniSearch implements IIndex {
    private _index: MiniSearch<any>;
    private _id = 0;

    constructor() {
        this._index = new MiniSearch({
            fields: ['path', 'text', 'tags'],
            storeFields: ['path']
        });
    }

    public indexFile = (path: string, text: string, tags: string[]) => {
        const id = this._id++;
        this._index.add({ id, path, text, tags });
    }

    public search = (query: string) => {
        return Promise.resolve(this._index.search(query).map(r => r.path));
    }
}
