import { Search } from 'js-search';

export class MyJsSearch {
    private search: Search;

    constructor() {
        this.search = new Search('path');
        this.search.addIndex('text');
        this.search.addIndex('tags');
    }

    public indexFile = (path: string, text: string, tags: string[]) => {
        this.search.addDocument({ path, text, tags });
    }
}

function demo() {
    var theGreatGatsby = {
        isbn: '9781597226769',
        title: 'The Great Gatsby',
        author: {
        name: 'F. Scott Fitzgerald'
        },
        tags: ['book', 'inspirational']
    };
    var theDaVinciCode = {
        isbn: '0307474275',
        title: 'The DaVinci Code',
        author: {
        name: 'Dan Brown'
        },
        tags: ['book', 'mystery']
    };
    var angelsAndDemons = {
        isbn: '074349346X',
        title: 'Angels & Demons',
        author: {
        name: 'Dan Brown',
        },
        tags: ['book', 'mystery']
    };

    var search = new Search('isbn');
    search.addIndex('title');
    search.addIndex(['author', 'name']);
    search.addIndex('tags')

    search.addDocuments([theGreatGatsby, theDaVinciCode, angelsAndDemons]);

    console.log(search.search('The'));
}
