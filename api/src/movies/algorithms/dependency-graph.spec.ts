import { hasCycle, wouldCreateCycle } from './dependency-graph';

describe('Dependency Graph & Cycle Detection Algorithms', () => {
  describe('hasCycle', () => {
    it('should return false for an empty graph', () => {
      expect(hasCycle(new Map())).toBe(false);
    });

    it('should return false for a linear DAG: A -> B -> C', () => {
      const graph = new Map<string, string[]>([
        ['A', ['B']],
        ['B', ['C']],
        ['C', []],
      ]);
      expect(hasCycle(graph)).toBe(false);
    });

    it('should return true for a direct self cycle: A -> A', () => {
      const graph = new Map<string, string[]>([['A', ['A']]]);
      expect(hasCycle(graph)).toBe(true);
    });

    it('should return true for a 2-node cycle: A -> B -> A', () => {
      const graph = new Map<string, string[]>([
        ['A', ['B']],
        ['B', ['A']],
      ]);
      expect(hasCycle(graph)).toBe(true);
    });

    it('should return true for an indirect cycle: A -> B -> C -> A', () => {
      const graph = new Map<string, string[]>([
        ['A', ['B']],
        ['B', ['C']],
        ['C', ['A']],
      ]);
      expect(hasCycle(graph)).toBe(true);
    });

    it('should return false for diamond dependencies (shared prerequisites, not a cycle)', () => {
      // D depends on B and C; both B and C depend on A
      const graph = new Map<string, string[]>([
        ['D', ['B', 'C']],
        ['B', ['A']],
        ['C', ['A']],
        ['A', []],
      ]);
      expect(hasCycle(graph)).toBe(false);
    });
  });

  describe('wouldCreateCycle', () => {
    it('should detect direct self-dependency immediately', () => {
      const graph = new Map<string, string[]>([['A', []]]);
      expect(wouldCreateCycle(graph, 'A', ['A'])).toBe(true);
    });

    it('should allow valid new prerequisites on a DAG', () => {
      const graph = new Map<string, string[]>([
        ['The Avengers', ['Iron Man']],
        ['Civil War', ['The Avengers']],
        ['Iron Man', []],
      ]);
      expect(wouldCreateCycle(graph, 'Civil War', ['The Avengers', 'Iron Man'])).toBe(false);
    });

    it('should detect indirect cycle when adding dependency from ancestor to descendant', () => {
      // Iron Man -> none, The Avengers -> Iron Man, Civil War -> The Avengers, Endgame -> Civil War
      const graph = new Map<string, string[]>([
        ['Endgame', ['Civil War']],
        ['Civil War', ['The Avengers']],
        ['The Avengers', ['Iron Man']],
        ['Iron Man', []],
      ]);

      // Proposing Iron Man -> Endgame creates Iron Man -> Endgame -> Civil War -> Avengers -> Iron Man
      expect(wouldCreateCycle(graph, 'Iron Man', ['Endgame'])).toBe(true);
    });
  });
});
