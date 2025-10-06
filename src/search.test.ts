import { IIndexedFts, IIndexlessFts, isIndexedFts } from './interfaces';
import { MyJsSearch } from './jssearch/myJsSearch';
import { LunrSearch } from './lunr/lunrSearch';
import { MyMiniSearch } from './minisearch/myMiniSearch';

declare global {
  namespace jest {
    interface Matchers<R, T> {
      toBeFound: (results: R) => Promise<T>;
    }
  }
}

expect.extend({
  async toBeFound(receivedPromise: Promise<string[]>) {
    const received = await receivedPromise;
    return received.length > 0
      ? {
        message: () => `expected no results, but found ${received.length}`,
        pass: true
      }
      : {
        message: () => 'returned no results',
        pass: false
      };
  }
});

const aTextFilePath = '/a/b/c.txt';

class FileAndTags {
  constructor(
    public path: string,
    public text: string,
    public tags: string[] = []
  ) {}
}

type SearchBuilder = () => IIndexedFts | IIndexlessFts;
type SearchBuilderTuple = [string, SearchBuilder];

const searchBuilders: SearchBuilderTuple[] = [
    [ 'lunr', () => new LunrSearch() ],

    // todo: fix failing tests in these, if they ever implement term presence
    // [ 'minisearch', () => new MyMiniSearch() ],
    // [ 'js-search', () => new MyJsSearch()]
];

describe.each(searchBuilders)('%s', (name, builder) => {
  let fts: IIndexedFts | IIndexlessFts;

  const index = async (files: FileAndTags[]) => {
    fts = builder();

    if (isIndexedFts(fts)) {
      for (const file of files) {
        fts.indexFile(file.path, file.text, file.tags);
      }
    }
  };

  const searchFor = async (query: string, text: string, tags: string[] = []) => {
    if (isIndexedFts(fts)) {
        await index([new FileAndTags(aTextFilePath, text, tags)]);
        return fts.search(query);
    } else {
        return fts.search(text, query);
    }
  };

  beforeEach(() => {
    fts = new LunrSearch();
  });

  it('index and search example', async () => {
    await index([
      new FileAndTags('a/b.txt', 'blah blah some stuff and things'),
      new FileAndTags('a/b/c.log', 'what about shoes and biscuits'),
    ]);

    if (isIndexedFts(fts)) {
        const results = await fts.search('blah');
        expect(results.length).toBe(1);
        expect(results[0]).toBe('a/b.txt');
    }
  });

  it('findsSingleWord', async () => {
    await expect(searchFor("ham", "the ham is good")).toBeFound();
  });

  it('doesNotFindMissingWord', async () => {
    await expect(searchFor("pizza", "the ham is good")).not.toBeFound();
  });

  describe('stemming', () => {
      it('simple', async () => {
        await expect(searchFor("bike", "I own several bikes")).toBeFound();
      });

      it('libraries', async () => {
        await expect(searchFor("library", "libraries")).toBeFound();
      });

      // lunr doesn't stem -like
      it.skip('catlike', async () => {
        await expect(searchFor("cat", "catlike")).toBeFound();
      });

      it('fishing', async () => {
        await expect(searchFor("fish", "fishing")).toBeFound();
      });

      it('argue arguing', async () => {
        await expect(searchFor("argue", "arguing")).toBeFound();
      });
  });

  describe('stop words', () => {
    it('are not included in search', async () => {
        await expect(searchFor("it and", "I saw it and ate chips")).not.toBeFound();
    });
  });

  it('finds word before slash', async () => {
    await expect(searchFor("red", "red/green/refactor")).toBeFound();
  });

  it('finds after slash', async () => {
    await expect(searchFor("refactor", "red/green/refactor")).toBeFound();
  });

  describe('markdown links', () => {
    it('finds single word', async () => {
      await expect(searchFor("bike", "I have a [bike](a/b/c)")).toBeFound();
    });

    it('finds first word', async () => {
      await expect(searchFor("ham", "I have a [ham bike](a/b/c)")).toBeFound();
    });

    it('finds middle word', async () => {
      await expect(searchFor("ham", "I have a [super ham bike](a/b/c)")).toBeFound();
    });

    it('finds last word', async () => {
      await expect(searchFor("bike", "I have a [ham bike](a/b/c)")).toBeFound();
    });
  });

  describe('or operator', () => {
    it('isDefault', async () => {
      await expect(searchFor("ham good", "the ham is good")).toBeFound();
      await expect(searchFor("ham or good", "the ham is good")).toBeFound();
    });

    it('findsAtLeastOnePresentWord', async () => {
      await expect(searchFor("ham jabberwocky turtle house cannon", "the ham is good")).toBeFound();
    });
  });

  // note: lunr doesn't have an AND operator
  describe('plus operator', () => {
    it('finds multiple words', async () => {
      await expect(searchFor("+ham +good", "the ham is good")).toBeFound();
    });

    it('rejects any missing words', async () => {
      await expect(searchFor("+ham +pizza", "the ham is good")).not.toBeFound();
    });
  });

  describe('not operator', () => {
    it('finds word when excluded word is missing', async () => {
      await expect(searchFor("ham -pizza", "the ham is good")).toBeFound();
    });

    it('does not find when excluded word is present', async () => {
      await expect(searchFor("ham -good", "the ham is good")).not.toBeFound();
    });
  });

  describe('search with tags', () => {
    it('finds single tag', async () => {
      await expect(searchFor("#beef", "The tags are", ['beef', 'chowder'])).toBeFound();
    });

    it('finds multiple tags', async () => {
      await expect(searchFor("#beef #chowder", "The tags are", ['beef', 'chowder'])).toBeFound();
    });

    it('does not find missing tag', async () => {
      await expect(searchFor("#asdf", "The tags are", ['beef', 'chowder'])).not.toBeFound();
    });

    it('does not find non tag', async () => {
      await expect(searchFor("#tags", "The tags are", ['beef', 'chowder'])).not.toBeFound();
    });

    it('works with operators', async () => {
      await expect(searchFor("#beef -#chowder", "The tags are", ['beef', 'chowder'])).not.toBeFound();
    });
  });
});
