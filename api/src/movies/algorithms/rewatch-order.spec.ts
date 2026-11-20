import { computeRewatchOrder, MovieNode } from './rewatch-order';
import { CircularDependencyException } from '../../common/exceptions/circular-dependency.exception';

describe('Rewatch Order Algorithm', () => {
  const sampleMovies: MovieNode[] = [
    { id: 'm1', title: 'Iron Man', releaseYear: 2008, runtimeMinutes: 126, watched: false },
    { id: 'm2', title: 'Captain America: The First Avenger', releaseYear: 2011, runtimeMinutes: 124, watched: false },
    { id: 'm3', title: 'The Avengers', releaseYear: 2012, runtimeMinutes: 143, watched: false },
    { id: 'm4', title: 'Captain America: Civil War', releaseYear: 2016, runtimeMinutes: 147, watched: false },
    { id: 'm5', title: 'Thor: Ragnarok', releaseYear: 2017, runtimeMinutes: 130, watched: false },
    { id: 'm6', title: 'Avengers: Infinity War', releaseYear: 2018, runtimeMinutes: 149, watched: false },
    { id: 'm7', title: 'Avengers: Endgame', releaseYear: 2019, runtimeMinutes: 181, watched: false },
    { id: 'm8', title: 'Avengers: Doomsday', releaseYear: 2026, runtimeMinutes: 180, watched: false },
  ];

  const moviesMap = new Map<string, MovieNode>(sampleMovies.map((m) => [m.id, { ...m }]));

  const adjacencyList = new Map<string, string[]>([
    ['m1', []],
    ['m2', []],
    ['m3', ['m1', 'm2']],
    ['m4', ['m3']],
    ['m5', []],
    ['m6', ['m4', 'm5']],
    ['m7', ['m6']],
    ['m8', ['m7']],
  ]);

  it('should return empty list and zero counts for Thor: Ragnarok (no prerequisites)', () => {
    const result = computeRewatchOrder('m5', moviesMap, adjacencyList);

    expect(result.targetMovie.title).toBe('Thor: Ragnarok');
    expect(result.movies).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(result.watchedCount).toBe(0);
    expect(result.unwatchedCount).toBe(0);
    expect(result.remainingRuntimeMinutes).toBe(0);
  });

  it('should return Iron Man and The First Avenger before The Avengers for Civil War', () => {
    const result = computeRewatchOrder('m4', moviesMap, adjacencyList);

    expect(result.targetMovie.title).toBe('Captain America: Civil War');
    expect(result.totalCount).toBe(3);

    const titles = result.movies.map((m) => m.title);
    expect(titles).toContain('Iron Man');
    expect(titles).toContain('Captain America: The First Avenger');
    expect(titles).toContain('The Avengers');

    // Prerequisite-before-dependent constraint:
    const ironManIdx = titles.indexOf('Iron Man');
    const capIdx = titles.indexOf('Captain America: The First Avenger');
    const avengersIdx = titles.indexOf('The Avengers');

    expect(ironManIdx).toBeLessThan(avengersIdx);
    expect(capIdx).toBeLessThan(avengersIdx);

    // Target movie Civil War must NOT be in the movies list
    expect(titles).not.toContain('Captain America: Civil War');
  });

  it('should include all seven sample movies exactly once for Avengers: Doomsday in valid order', () => {
    const result = computeRewatchOrder('m8', moviesMap, adjacencyList);

    expect(result.targetMovie.title).toBe('Avengers: Doomsday');
    expect(result.totalCount).toBe(7);
    expect(result.movies.length).toBe(7);

    // Excludes target
    const titles = result.movies.map((m) => m.title);
    expect(titles).not.toContain('Avengers: Doomsday');

    // Check unique occurrences
    const uniqueTitles = new Set(titles);
    expect(uniqueTitles.size).toBe(7);

    // Verify topological ordering constraints
    expect(titles.indexOf('Iron Man')).toBeLessThan(titles.indexOf('The Avengers'));
    expect(titles.indexOf('Captain America: The First Avenger')).toBeLessThan(titles.indexOf('The Avengers'));
    expect(titles.indexOf('The Avengers')).toBeLessThan(titles.indexOf('Captain America: Civil War'));
    expect(titles.indexOf('Captain America: Civil War')).toBeLessThan(titles.indexOf('Avengers: Infinity War'));
    expect(titles.indexOf('Thor: Ragnarok')).toBeLessThan(titles.indexOf('Avengers: Infinity War'));
    expect(titles.indexOf('Avengers: Infinity War')).toBeLessThan(titles.indexOf('Avengers: Endgame'));
  });

  it('should calculate watchedCount and remainingRuntimeMinutes correctly when movies are watched', () => {
    const customMap = new Map<string, MovieNode>(sampleMovies.map((m) => [m.id, { ...m }]));
    // Mark Iron Man (126 min) and First Avenger (124 min) as watched
    customMap.get('m1')!.watched = true;
    customMap.get('m2')!.watched = true;

    // Target is Civil War (total prerequisites runtime: 126 + 124 + 143 = 393 min)
    // Remaining unwatched runtime: The Avengers (143 min)
    const result = computeRewatchOrder('m4', customMap, adjacencyList);

    expect(result.totalCount).toBe(3);
    expect(result.watchedCount).toBe(2);
    expect(result.unwatchedCount).toBe(1);
    expect(result.remainingRuntimeMinutes).toBe(143);
  });

  it('should not include the target movie in watched count or runtime even if target is watched', () => {
    const customMap = new Map<string, MovieNode>(sampleMovies.map((m) => [m.id, { ...m }]));
    // Target is Civil War, mark it watched
    customMap.get('m4')!.watched = true;

    const result = computeRewatchOrder('m4', customMap, adjacencyList);

    expect(result.totalCount).toBe(3);
    expect(result.watchedCount).toBe(0);
    expect(result.unwatchedCount).toBe(3);
    expect(result.remainingRuntimeMinutes).toBe(126 + 124 + 143);
  });

  it('should detect cycles and throw CircularDependencyException', () => {
    // Introduce a cycle: m1 requires m7 (Iron Man requires Endgame)
    const cyclicAdjacency = new Map<string, string[]>(adjacencyList);
    cyclicAdjacency.set('m1', ['m7']);

    expect(() => computeRewatchOrder('m8', moviesMap, cyclicAdjacency)).toThrow(
      CircularDependencyException,
    );
  });
});
