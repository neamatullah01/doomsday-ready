import { CircularDependencyException } from '../../common/exceptions/circular-dependency.exception';

export interface MovieNode {
  id: string;
  title: string;
  releaseYear: number;
  runtimeMinutes: number;
  watched: boolean;
}

export interface RewatchOrderResult {
  targetMovie: {
    id: string;
    title: string;
  };
  movies: MovieNode[];
  watchedCount: number;
  totalCount: number;
  unwatchedCount: number;
  remainingRuntimeMinutes: number;
}

const enum VisitState {
  Unvisited = 0,
  Visiting = 1,
  Visited = 2,
}
export function computeRewatchOrder(
  targetId: string,
  allMovies: Map<string, MovieNode>,
  adjacencyList: Map<string, string[]>,
): RewatchOrderResult {
  const target = allMovies.get(targetId);
  if (!target) {
    throw new Error(`Target movie with ID "${targetId}" not found in graph.`);
  }

  const visitStates = new Map<string, VisitState>();
  const orderedPrerequisites: MovieNode[] = [];

  function dfs(currentId: string) {
    visitStates.set(currentId, VisitState.Visiting);

    const prereqIds = adjacencyList.get(currentId) || [];
    for (const prereqId of prereqIds) {
      const state = visitStates.get(prereqId) ?? VisitState.Unvisited;

      if (state === VisitState.Visiting) {
        throw new CircularDependencyException(
          'The prerequisite relationship would create a circular dependency.',
        );
      }

      if (state === VisitState.Unvisited) {
        dfs(prereqId);
      }
    }

    visitStates.set(currentId, VisitState.Visited);

    if (currentId !== targetId) {
      const movie = allMovies.get(currentId);
      if (movie) {
        orderedPrerequisites.push(movie);
      }
    }
  }

  dfs(targetId);

  const watchedCount = orderedPrerequisites.filter((m) => m.watched).length;
  const totalCount = orderedPrerequisites.length;
  const unwatchedCount = totalCount - watchedCount;
  const remainingRuntimeMinutes = orderedPrerequisites
    .filter((m) => !m.watched)
    .reduce((sum, m) => sum + m.runtimeMinutes, 0);

  return {
    targetMovie: {
      id: target.id,
      title: target.title,
    },
    movies: orderedPrerequisites,
    watchedCount,
    totalCount,
    unwatchedCount,
    remainingRuntimeMinutes,
  };
}
