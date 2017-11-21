let assert = require('assert');

function applyEqual(kv, q) {
	let key = Object.keys(kv)[0];
	let val = kv[key];

	q.where(`${key} = ${val}`);
}

function handleObject(kv, q) {
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
				q.where(`${key} IN ${kv[key][k]}`)
		}
	})
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
					applyEqual({ [k]: this.obj[k] }, query);
					break;
				case 'object':
					handleObject({ [k]: this.obj[k] }, query);
					break;
			}
		});
	}

	toJsFilter() {
		return (i) => {
			let valid = true;

			Object.keys(this.obj).forEach(key => {
				if (i[key] !== this.obj[key]) {
					valid = false;
				}
			});

			return valid;
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
