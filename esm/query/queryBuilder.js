import { and, compare, contains, containsIgnoreCase, createCTE, equal, fuzzyContains, greaterThan, greaterThanOrEqual, inOperator, includes, lessThan, lessThanOrEqual, notEqual, or, } from "./cte.js";
import { applyCTE } from "./filterEngine.js";
import { cloneCTE } from "./utils.js";
import { applyJoins } from "./joins.js";
/**
 * QueryBuilder - fluent API for building JSON-serializable CTEs that can be compiled
 */
export class QueryBuilder {
    constructor() {
        this._joins = [];
        this._cte = createCTE();
    }
    createSubBuilder() {
        return new QueryBuilder();
    }
    where(filter) {
        if (!this._cte.filters) {
            this._cte.filters = [];
        }
        this._cte.filters.push(filter);
        return this;
    }
    compare(field, operator, value) {
        return this.where(compare(field, operator, value));
    }
    equal(field, value) {
        return this.where(equal(field, value));
    }
    notEqual(field, value) {
        return this.where(notEqual(field, value));
    }
    greaterThan(field, value) {
        return this.where(greaterThan(field, value));
    }
    lessThan(field, value) {
        return this.where(lessThan(field, value));
    }
    greaterThanOrEqual(field, value) {
        return this.where(greaterThanOrEqual(field, value));
    }
    lessThanOrEqual(field, value) {
        return this.where(lessThanOrEqual(field, value));
    }
    in(field, value) {
        return this.where(inOperator(field, value));
    }
    contains(field, value) {
        return this.where(contains(field, value));
    }
    containsIgnoreCase(field, value) {
        return this.where(containsIgnoreCase(field, value));
    }
    fuzzyContains(field, value) {
        return this.where(fuzzyContains(field, value));
    }
    includes(field, value) {
        return this.where(includes(field, value));
    }
    and(...filters) {
        return this.where(and(...filters));
    }
    or(...filters) {
        return this.where(or(...filters));
    }
    join(rightCollection, leftField, rightField, type = "inner") {
        const resolvedRightField = rightField ?? rightCollection.getKeyField();
        if (!resolvedRightField) {
            throw new Error("join requires a rightField when the joined collection does not expose a key field");
        }
        this._joins.push({
            collection: rightCollection,
            leftField,
            rightField: resolvedRightField,
            type,
        });
        if (!this._cte.joins) {
            this._cte.joins = [];
        }
        this._cte.joins.push({
            collectionId: rightCollection.id,
            leftField,
            rightField: resolvedRightField,
            type,
        });
        return this;
    }
    orderBy(field, direction = "asc") {
        if (!this._cte.orderBy) {
            this._cte.orderBy = [];
        }
        this._cte.orderBy.push({ field: field, direction });
        return this;
    }
    limit(n) {
        if (n < 0) {
            throw new Error("limit must be >= 0");
        }
        this._cte.limit = n;
        return this;
    }
    offset(n) {
        if (n < 0) {
            throw new Error("offset must be >= 0");
        }
        this._cte.offset = n;
        return this;
    }
    paginate(page, pageSize = 10) {
        if (page < 0) {
            throw new Error("page must be >= 0");
        }
        if (pageSize <= 0) {
            throw new Error("pageSize must be > 0");
        }
        this._cte.offset = page * pageSize;
        this._cte.limit = pageSize;
        return this;
    }
    with(name, fn) {
        const subqueryBuilder = fn(this.createSubBuilder());
        const subqueryCTE = subqueryBuilder.toCTE();
        if (!this._cte.ctes) {
            this._cte.ctes = {};
        }
        this._cte.ctes[name] = subqueryCTE;
        return this;
    }
    subscribe(onUpdate, onError) {
        throw new Error("QueryBuilder.subscribe requires a runtime query compiler");
    }
    toCTE() {
        return cloneCTE(this._cte);
    }
    compileToFunction() {
        if (this._joins.length > 0) {
            throw new Error("compileToFunction does not support joins");
        }
        const cte = cloneCTE(this._cte);
        return (docs) => applyCTE(cte, docs);
    }
}
export class RuntimeQueryBuilder extends QueryBuilder {
    constructor(compile) {
        super();
        this._compile = compile;
    }
    createSubBuilder() {
        return new RuntimeQueryBuilder(this._compile);
    }
    subscribe(onUpdate, onError) {
        const errorHandler = onError ||
            ((error) => {
                throw error;
            });
        if (this._joins.length === 0) {
            return this._compile(this._cte)({
                onUpdate,
                onError: errorHandler,
            });
        }
        const rootSubscribe = this._compile(this._cte);
        let rootDocs = [];
        const rightRows = this._joins.map(() => []);
        const emit = () => {
            const results = applyJoins(rootDocs, this._joins, rightRows);
            onUpdate(results);
        };
        const rootUnsub = rootSubscribe({
            onUpdate(docs) {
                rootDocs = docs;
                emit();
            },
            onError: errorHandler,
        });
        const joinUnsubs = this._joins.map((join, index) => join.collection.query().subscribe((docs) => {
            rightRows[index] = docs;
            emit();
        }, errorHandler));
        return () => {
            rootUnsub();
            for (const unsub of joinUnsubs) {
                unsub();
            }
        };
    }
}
export function createQueryBuilder(compile) {
    return compile ? new RuntimeQueryBuilder(compile) : new QueryBuilder();
}
//# sourceMappingURL=queryBuilder.js.map