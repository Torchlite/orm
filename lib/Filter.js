let assert = require('assert');

let squel = require('squel').useFlavour('postgres');

function applyEqualSql(kv, q) {
	let key = Object.keys(kv)[0];
	let val = kv[key];

	q.where(`${key} = ${val}`);
}

function handleObjectSql(kv, q) {
	let key = Object.keys(kv)[0];

	Object.keys(kv[key]).forEach(k => {
		switch(k) {
			case '$gt':
				q.where(`${key} > ${kv[key][k]}`);
				break;
			case '$lt':
				q.where(`${key} < ${kv[key][k]}`);
				break;
			case '$lte':
				q.where(`${key} <= ${kv[key][k]}`);
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
	})
}

function handleObjectToSql(kv, q) {
	let key = Object.keys(kv)[0];

	Object.keys(kv[key]).forEach(k => {
		switch(k) {
			case '$gt':
				q.and(`${key} > ${kv[key][k]}`);
				break;
			case '$lt':
				q.and(`${key} < ${kv[key][k]}`);
				break;
			case '$lte':
				q.and(`${key} <= ${kv[key][k]}`);
				break;
			case '$gte':
				q.and(`${key} >= ${kv[key][k]}`);
				break;
			case '$ne':
				q.and(`${key} != ${kv[key][k]}`);
				break;
			case '$in':
				q.and(`${key} IN ?`, kv[key][k]);
				break;
			default:
				let newObject = {};
				q.and(`${key}.${k} = ${kv[key][k]}`);
				break;
		}
	})
}

function buildEqualFn(kv) {
	let key = Object.keys(kv)[0];
	let val = kv[key];

	return (i) => {
		if(i[key] !== val) {
			return false;
		}

		return true;
	}
}

function buildObjectFunction(kv) {
	let key = Object.keys(kv)[0];
	let functions = [];

	Object.keys(kv[key]).forEach(k => {
		switch(k) {
			case '$gt':
				functions.push((i) => {
					if (i[key] > kv[key][k]) {
						return  true;
					}

					return false;
				});
				break;
			case '$lt':
				functions.push((i) => {
					if (i[key] < kv[key][k]) {
						return  true;
					}

					return false;
				});
				break;
			case '$lte':
				functions.push((i) => {
					if (i[key] <= kv[key][k]) {
						return  true;
					}

					return false;
				});
				break;
			case '$gte':
				functions.push((i) => {
					if (i[key] >= kv[key][k]) {
						return  true;
					}

					return false;
				});
				break;
			case '$ne':
				functions.push((i) => {
					if (i[key] !== kv[key][k]) {
						return  true;
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

	return function(i) {
		return functions.every(f => f(i));
	}
}

class Filter {
	constructor(obj={}) {
		this.obj = obj;
	}

	applyToSql(query) {
		Object.keys(this.obj).forEach(k => {
			switch(typeof this.obj[k]) {
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

	toSql() {
		let sql = squel.expr();

		Object.keys(this.obj).forEach(k => {
			switch(typeof this.obj[k]) {
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

	toJsFilter() {
		let functions = [];

		Object.keys(this.obj).forEach(k => {
			switch(typeof this.obj[k]) {
				case 'number':
				case 'string':
					functions.push(buildEqualFn({ [k]: this.obj[k] }));
					break;
				case 'object':
					functions.push(buildObjectFunction({ [k]: this.obj[k] }))
					break;
			}
		});

		return function(i) {
			return functions.every(f => f(i));
		}
	}

	merge(otherFilter) {
		return new Filter({ ...this.obj, ...otherFilter.obj });
	}

	static fromQueryParams(query) {
		return new Filter(query);
	}
}

module.exports = Filter;
