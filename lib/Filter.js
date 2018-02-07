let squel = require('squel').useFlavour('postgres');

function applyEqualSql(kv, q) {
	let key = Object.keys(kv)[0];
	let val = kv[key];

	q.where(`${key} = ${val}`);
}

function handleObjectSql(kv, q) {
	let key = Object.keys(kv)[0];

	Object.keys(kv[key]).forEach(k => {
		switch (k) {
			case '$gt':
				q.where(`${key} > ?`, kv[key][k]);
				break;
			case '$lt':
				q.where(`${key} < ?`, kv[key][k]);
				break;
			case '$lte':
				q.where(`${key} <= ?`, kv[key][k]);
				break;
			case '$gte':
				q.where(`${key} >= ${kv[key][k]}`);
				break;
			case '$ne':
				q.where(`${key} != ${kv[key][k]}`);
				break;
			case '$in':
				q.where(`${key} IN ?`, kv[key][k]);
				break;
		}
	});
}

function handleObjectToSql(kv, q) {
	let key = Object.keys(kv)[0];

	Object.keys(kv[key]).forEach(k => {
		switch (k) {
			case '$gt':
				q.and(`${key} > ?`, kv[key][k]);
				break;
			case '$lt':
				q.and(`${key} < ?`, kv[key][k]);
				break;
			case '$lte':
				q.and(`${key} <= ?`, kv[key][k]);
				break;
			case '$gte':
				q.and(`${key} >= ?`, kv[key][k]);
				break;
			case '$ne':
				q.and(`${key} != ?`, kv[key][k]);
				break;
			case '$in':
				q.and(`${key} IN ?`, kv[key][k]);
				break;
			case '$null':
				if (kv[key][k] === 'true' || kv[key][k] === true) {
					q.and(`${key} is null`);
				} else {
					q.and(`${key} is not null`);
				}
				break;
			default:
				q.and(`${key}.${k} = ${kv[key][k]}`);
				break;
		}
	});
}

function buildEqualFn(kv) {
	let key = Object.keys(kv)[0];
	let val = kv[key];

	return (i) => {
		if (i[key] !== val) {
			return false;
		}

		return true;
	};
}

function buildObjectFunction(kv) {
	let key = Object.keys(kv)[0];
	let functions = [];

	Object.keys(kv[key]).forEach(k => {
		switch (k) {
			case '$gt':
				functions.push((i) => {
					if (i[key] > kv[key][k]) {
						return true;
					}

					return false;
				});
				break;
			case '$lt':
				functions.push((i) => {
					if (i[key] < kv[key][k]) {
						return true;
					}

					return false;
				});
				break;
			case '$lte':
				functions.push((i) => {
					if (i[key] <= kv[key][k]) {
						return true;
					}

					return false;
				});
				break;
			case '$gte':
				functions.push((i) => {
					if (i[key] >= kv[key][k]) {
						return true;
					}

					return false;
				});
				break;
			case '$ne':
				functions.push((i) => {
					if (i[key] !== kv[key][k]) {
						return true;
					}

					return false;
				});
				break;
			case '$in':
				functions.push((i) => {
					let allowed = kv[key][k];
					let toCheck = i[key];

					return allowed.some(a => a === toCheck);
				});
				break;
		}
	});

	return function (i) {
		return functions.every(f => f(i));
	};
}

class Filter {
	/**
	* A `Filter` is an instance of an object conforming to the filtering DSL
	* which can be turned into a `WHERE` clause, applied to a `select` query,
	* or turned into a javascript function for testing JS objects
	* @constructor
	* @param {Object} obj - the object conforming to the Filter DSL.
	*/
	constructor(obj = {}) {
		this.obj = obj;
	}

	/**
	* Apply the filter to the given query
	* @param {Object} query - an instance of squel.select()
	*/
	applyToSql(query) {
		Object.keys(this.obj).forEach(k => {
			switch (typeof this.obj[k]) {
				case 'number':
				case 'string':
					applyEqualSql({ [k]: this.obj[k] }, query);
					break;
				case 'object':
					handleObjectSql({ [k]: this.obj[k] }, query);
					break;
			}
		});
	}

	/** Transform the filter into the text of a sql WHERE-clause */
	toSql() {
		let sql = squel.expr();

		Object.keys(this.obj).forEach(k => {
			switch (typeof this.obj[k]) {
				case 'boolean':
					sql.and(`${k}`);
					break;
				case 'number':
				case 'string':
					sql.and(`${k} = ?`, this.obj[k]);
					break;
				case 'object':
					handleObjectToSql({ [k]: this.obj[k] }, sql);
					break;
			}
		});

		return sql.toString();
	}

	/**
	* Transform the filter into a JS function
	* The JS function takes an object and returns a bool;
	* `true` if the object passes the filter, and false otherwise
	*/
	toJsFilter() {
		let functions = [];

		Object.keys(this.obj).forEach(k => {
			switch (typeof this.obj[k]) {
				case 'boolean':
					functions.push((i) => {
						return this.obj[k] === i[k];
					});
					break;
				case 'number':
				case 'string':
					functions.push(buildEqualFn({ [k]: this.obj[k] }));
					break;
				case 'object':
					functions.push(buildObjectFunction({ [k]: this.obj[k] }));
					break;
			}
		});

		return function (i) {
			return functions.every(f => f(i));
		};
	}

	/**
	* Combine two filters into one
	*/
	merge(otherFilter) {
		return new this.constructor({ ...this.obj, ...otherFilter.obj });
	}
}

module.exports = Filter;
