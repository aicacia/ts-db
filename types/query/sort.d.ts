import type { CTEOrderBy } from "./cte.js";
export declare function compareValues(a: unknown, b: unknown): number;
export declare function compareOrderValues<T>(a: T, b: T, orderBy: CTEOrderBy<T>[]): number;
export declare function stableSortWithTieBreaker<T>(items: T[], comparator: (a: T, b: T) => number): T[];
export declare function createComparator<T>(orderBy: CTEOrderBy<T>[]): (a: T, b: T) => number;
//# sourceMappingURL=sort.d.ts.map