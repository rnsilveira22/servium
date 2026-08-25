const counters = new Map<string, number>();

export function increment(name: string, value = 1): void {
  counters.set(name, (counters.get(name) ?? 0) + value);
}

export function getCount(name: string): number {
  return counters.get(name) ?? 0;
}

export function getCounts(): Record<string, number> {
  return Object.fromEntries(counters);
}
