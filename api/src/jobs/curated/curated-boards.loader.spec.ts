import {
  parseCuratedBoards,
  loadCuratedBoards,
  resetCuratedBoardsCacheForTests,
} from './curated-boards.loader';

describe('curated-boards.loader', () => {
  afterEach(() => {
    resetCuratedBoardsCacheForTests();
  });

  it('loads and validates the checked-in board list', () => {
    const boards = loadCuratedBoards();
    expect(boards.length).toBeGreaterThanOrEqual(15);
    expect(boards.length).toBeLessThanOrEqual(25);
    expect(boards.every((b) => b.company && b.board && b.countries.length)).toBe(
      true,
    );
  });

  it('rejects invalid board config', () => {
    expect(() =>
      parseCuratedBoards([{ atsType: 'greenhouse', board: 'x' }]),
    ).toThrow();
  });
});
