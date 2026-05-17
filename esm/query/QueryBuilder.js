import { and, compare, contains, containsIgnoreCase, createCTE, equal, fuzzyContains, greaterThan, greaterThanOrEqual, includes, inOperator, lessThan, lessThanOrEqual, notEqual, or, } from "./cte.js";
import { D2Executor } from "./D2Executor.js";
export class QueryBuilder {
    constructor(sourceOrOptions = []) {
        this._joins = [];
        this._cte = createCTE();
        if (Array.isArray(sourceOrOptions)) {
            this._source = sourceOrOptions;
            this._executor = new D2Executor();
        }
        else {
            this._source = sourceOrOptions.source ?? [];
            this._executor = sourceOrOptions.executor ?? new D2Executor();
            this._adapter = sourceOrOptions.adapter;
        }
    }
    where(filter) {
        if (!this._cte.filters)
            this._cte.filters = [];
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
    orderBy(field, direction = "asc") {
        if (!this._cte.orderBy)
            this._cte.orderBy = [];
        this._cte.orderBy.push({ field, direction });
        return this;
    }
    limit(n) {
        this._cte.limit = n;
        return this;
    }
    offset(n) {
        this._cte.offset = n;
        return this;
    }
    paginate(page, pageSize = 10) {
        this._cte.offset = page * pageSize;
        this._cte.limit = pageSize;
        return this;
    }
    toCTE() {
        // Return a shallow copy to prevent mutation and include joins
        const cte = { ...this._cte };
        if (this._joins.length) {
            cte.joins = this._joins.map((j) => ({
                collectionId: j.collection.id,
                leftField: j.leftField,
                rightField: j.rightField,
                type: j.type,
            }));
        }
        return cte;
    }
    source(source) {
        this._source = source;
        return this;
    }
    join(collection, leftField, rightField, type = "left") {
        this._joins.push({
            collection: collection,
            leftField: String(leftField),
            rightField: rightField ? String(rightField) : String(leftField),
            type,
        });
        return this;
    }
    subscribe(onUpdate, onError) {
        try {
            const cte = this.toCTE();
            if (this._adapter) {
                let execUnsub = null;
                const adapterUnsub = this._adapter.subscribe((docs) => {
                    try {
                        if (execUnsub)
                            execUnsub();
                        this._source = docs.slice();
                        const query = this._executor.execute(cte, this._source, this._joins);
                        execUnsub = query.subscribe(onUpdate, onError);
                    }
                    catch (err) {
                        if (onError)
                            onError(err instanceof Error ? err : new Error(String(err)));
                    }
                }, onError ?? (() => { }), cte);
                return () => {
                    adapterUnsub();
                    if (execUnsub)
                        execUnsub();
                };
            }
            const query = this._executor.execute(cte, this._source, this._joins);
            return query.subscribe(onUpdate, onError);
        }
        catch (err) {
            if (onError)
                onError(err instanceof Error ? err : new Error(String(err)));
            return () => { };
        }
    }
}
//# sourceMappingURL=QueryBuilder.js.map