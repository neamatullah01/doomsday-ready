export function hasCycle(graph: Map<string, string[]>): boolean {
  const enum VisitState {
    Unvisited = 0,
    Visiting = 1,
    Visited = 2,
  }

  const states = new Map<string, VisitState>();

  function dfs(node: string): boolean {
    states.set(node, VisitState.Visiting);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      const neighborState = states.get(neighbor) ?? VisitState.Unvisited;
      if (neighborState === VisitState.Visiting) {
        return true;
      }
      if (neighborState === VisitState.Unvisited) {
        if (dfs(neighbor)) {
          return true;
        }
      }
    }

    states.set(node, VisitState.Visited);
    return false;
  }

  for (const node of graph.keys()) {
    if ((states.get(node) ?? VisitState.Unvisited) === VisitState.Unvisited) {
      if (dfs(node)) {
        return true;
      }
    }
  }

  return false;
}

export function wouldCreateCycle(
  existingGraph: Map<string, string[]>,
  targetId: string,
  proposedPrerequisites: string[],
): boolean {
  // Self-dependency: direct cycle
  if (proposedPrerequisites.includes(targetId)) {
    return true;
  }

  // Construct proposed graph
  const graph = new Map<string, string[]>();
  for (const [node, prereqs] of existingGraph.entries()) {
    graph.set(node, [...prereqs]);
  }
  graph.set(targetId, [...proposedPrerequisites]);

  // Ensure all prerequisite nodes exist in graph
  for (const prereq of proposedPrerequisites) {
    if (!graph.has(prereq)) {
      graph.set(prereq, existingGraph.get(prereq) || []);
    }
  }

  return hasCycle(graph);
}
