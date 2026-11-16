import { Lock, LockId } from '../models/lock';
import { PCB } from '../models/pcb';

export interface WaitGraphEdge {
  fromPid: number;     
  toPid: number;      
  lockId: LockId;
  lockName: string;
}

export interface DeadlockReport {
  hasDeadlock: boolean;
  cyclePids: number[];
  edges: WaitGraphEdge[];
  summary: string;
  suggestedVictimPid: number | null;
}

export class DeadlockDetector {
  public static detect(pcbs: Record<number, PCB>, locks: Record<LockId, Lock>): DeadlockReport {
    const edges: WaitGraphEdge[] = [];
    const adjList = new Map<number, Set<number>>();

    for (const lock of Object.values(locks)) {
      if (lock.heldByPid !== null) {
        for (const waitingPid of lock.waitingPids) {
          const pcb = pcbs[waitingPid];
          if (pcb && pcb.state === 'WAITING' && pcb.waitingForLock === lock.id) {
            edges.push({
              fromPid: waitingPid,
              toPid: lock.heldByPid,
              lockId: lock.id,
              lockName: lock.shopName,
            });

            if (!adjList.has(waitingPid)) adjList.set(waitingPid, new Set());
            adjList.get(waitingPid)!.add(lock.heldByPid);
          }
        }
      }
    }
    const visited = new Set<number>();
    const recStack = new Set<number>();
    const parentMap = new Map<number, number>();
    let cyclePath: number[] = [];

    const dfs = (node: number): boolean => {
      visited.add(node);
      recStack.add(node);

      const neighbors = adjList.get(node) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          parentMap.set(neighbor, node);
          if (dfs(neighbor)) return true;
        } else if (recStack.has(neighbor)) {
          cyclePath = [neighbor, node];
          let curr = node;
          while (parentMap.has(curr) && parentMap.get(curr) !== neighbor) {
            curr = parentMap.get(curr)!;
            cyclePath.push(curr);
          }
          cyclePath.reverse();
          return true;
        }
      }

      recStack.delete(node);
      return false;
    };

    for (const pid of adjList.keys()) {
      if (!visited.has(pid)) {
        if (dfs(pid)) break;
      }
    }

    if (cyclePath.length === 0) {
      return {
        hasDeadlock: false,
        cyclePids: [],
        edges,
        summary: 'No circular wait detected. Resource allocation graph is acyclic.',
        suggestedVictimPid: null,
      };
    }

    let suggestedVictimPid: number | null = null;
    let lowestPriority = Infinity;

    for (const pid of cyclePath) {
      const p = pcbs[pid];
      if (p) {
        if (p.priority < lowestPriority) {
          lowestPriority = p.priority;
          suggestedVictimPid = pid;
        }
      }
    }

    const summary = `Deadlock cycle detected among orders [${cyclePath.join(' -> ')}]. Circular wait for exclusive shop equipment prevents any of these orders from progressing.`;

    return {
      hasDeadlock: true,
      cyclePids: cyclePath,
      edges,
      summary,
      suggestedVictimPid,
    };
  }
}
