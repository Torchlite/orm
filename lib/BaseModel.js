let squel = require('squel').useFlavour('postgres');

function generate(pool) {
	class BaseModel {
		constructor() {}
		static get table() {
			throw new Error('A model must be backed by a table, but this one is not');
		}

		static fromSqlRow(row) {
			throw new Error('Must implement `fromSqlRow`');
		}

		static get fieldMap() {
			throw new Error('Must implement `fieldMap`');
		}

		saveSql() {
			let table = this.constructor.table;
			let fm = this.constructor.fieldMap;

			let q = squel.insert()
				.into(table.tableName);

			let conflictObject = {};

			Object.keys(fm).forEach(k => {
				if (!this[k]) {
					return;
				}

				conflictObject[fm[k]] = this[k];

				q.set(fm[k], this[k]);
			});

			q.onConflict(table.pkey, conflictObject)

			return q.toString();
		}

		async save() {
			return pool.query(this.saveSql);
		}
	}

	return BaseModel;
}

module.exports = generate;
