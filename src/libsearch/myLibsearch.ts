import { search } from 'libsearch';
import { IIndex } from "../IIndex";

interface Ifile {
    path: string
    text: string
}

export class MyLibsearch implements IIndex {
    private _files: Ifile[] = [];

    public indexFile = (path: string, text: string, tags: string[]) => {
        this._files.push({path, text});
    }

    public search = (query: string) => {
        return Promise.resolve(
            search(this._files, query, x => x.text)
                .map(x => x.path)
        );
    }
}
