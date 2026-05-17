"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryBuilder = void 0;
const cte_js_1 = require("./cte.js");
const D2Executor_js_1 = require("./D2Executor.js");
class QueryBuilder {
    constructor(sourceOrOptions = []) {
        var _a, _b;
        this._joins = [];
        this._cte = (0, cte_js_1.createCTE)();
        if (Array.isArray(sourceOrOptions)) {
            this._source = sourceOrOptions;
            this._executor = new D2Executor_js_1.D2Executor();
        }
        else {
            this._source = (_a = sourceOrOptions.source) !== null && _a !== void 0 ? _a : [];
            this._executor = (_b = sourceOrOptions.executor) !== null && _b !== void 0 ? _b : new D2Executor_js_1.D2Executor();
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
        return this.where((0, cte_js_1.compare)(field, operator, value));
    }
    equal(field, value) {
        return this.where((0, cte_js_1.equal)(field, value));
    }
    notEqual(field, value) {
        return this.where((0, cte_js_1.notEqual)(field, value));
    }
    greaterThan(field, value) {
        return this.where((0, cte_js_1.greaterThan)(field, value));
    }
    lessThan(field, value) {
        return this.where((0, cte_js_1.lessThan)(field, value));
    }
    greaterThanOrEqual(field, value) {
        return this.where((0, cte_js_1.greaterThanOrEqual)(field, value));
    }
    lessThanOrEqual(field, value) {
        return this.where((0, cte_js_1.lessThanOrEqual)(field, value));
    }
    in(field, value) {
        return this.where((0, cte_js_1.inOperator)(field, value));
    }
    contains(field, value) {
        return this.where((0, cte_js_1.contains)(field, value));
    }
    containsIgnoreCase(field, value) {
        return this.where((0, cte_js_1.containsIgnoreCase)(field, value));
    }
    fuzzyContains(field, value) {
        return this.where((0, cte_js_1.fuzzyContains)(field, value));
    }
    includes(field, value) {
        return this.where((0, cte_js_1.includes)(field, value));
    }
    and(...filters) {
        return this.where((0, cte_js_1.and)(...filters));
    }
    or(...filters) {
        return this.where((0, cte_js_1.or)(...filters));
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
        const cte = Object.assign({}, this._cte);
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
                }, onError !== null && onError !== void 0 ? onError : (() => { }), cte);
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
exports.QueryBuilder = QueryBuilder;
//# sourceMappingURL=QueryBuilder.js.map