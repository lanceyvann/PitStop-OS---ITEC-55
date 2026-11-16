/**
 * @file prng.ts
 * @description Deterministic Mulberry32 seeded pseudo-random number generator.
 * Guarantees 100% reproducible simulations across identical seeds and workloads.
 */

export class Mulberry32 {
  private state: number;

  /**
   * Initializes the PRNG with an integer seed.
   * @param seed Numeric seed for deterministic generation.
   */
  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /**
   * Generates the next pseudo-random floating-point number in [0, 1).
   * Standard Mulberry32 algorithm.
   */
  public next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = Math.imul(this.state ^ (this.state >>> 15), 1 | this.state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generates an integer in the inclusive range [min, max].
   * @param min Minimum inclusive integer.
   * @param max Maximum inclusive integer.
   */
  public range(min: number, max: number): number {
    if (min >= max) return min;
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Randomly picks one item from an array.
   * @param array Source array.
   */
  public choice<T>(array: T[]): T {
    const index = Math.floor(this.next() * array.length);
    return array[index];
  }

  /**
   * Returns current internal state integer (for state snapshots).
   */
  public getState(): number {
    return this.state;
  }

  /**
   * Restores internal state integer (for Time Machine rewind).
   */
  public setState(state: number): void {
    this.state = state >>> 0;
  }
}
