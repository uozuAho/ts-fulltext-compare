import { IIndexlessFts } from "../interfaces";

export class MyDiySearch implements IIndexlessFts {
    public search = (path: string, query: string) => {
        return Promise.resolve([]);
    }
}
