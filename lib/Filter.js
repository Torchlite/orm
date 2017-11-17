class Filter {
	constructor(obj={}) {
		this.obj = obj;
	}

	applyToSql(query) {
		Object.keys(this.obj).forEach(k => {
			switch(typeof this.obj[k]) {
				case 'string':
				case 'number':
					query.where(`${k} = ?`, this.obj[k]);
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
}

module.exports = Filter;
