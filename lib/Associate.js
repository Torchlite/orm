let Traits = require('protoduck');
let squel = require('squel').useFlavour('postgres');

function generate(pool) {
	/**
	* Trait to define associations.
	*   see https://github.com/zkat/protoduck
	*/
	let Associate = Traits.define(['otherModel'], {
		foreignKey: ['otherModel'],
		otherKey: [function (otherModel) {
			throw new Error('This kind of association requires `otherKey`');
		}],
		joinTable: [function (otherModel) {
			throw new Error('This kind of association requires a `joinTable`');
		}],
		associationType: ['otherModel'],
		get: [function (otherModel) {
			let otherInstance = new otherModel();
			return pool.query(this.genSql(otherModel))
				.then(res => {
					switch (this.associationType(otherInstance)) {
						case 'manyToOne':
							return new otherModel(res.rows[0]);
						case 'oneToMany':
						case 'manyToMany':
							return res.rows.map(r => new otherModel(r));
					}
				});
		}],

		genSql: [function (otherModel) {
			let otherTable = otherModel.table;
			let otherInstance = new otherModel();
			let fk = this.foreignKey(otherInstance);

			let q = squel.select();

			switch (this.associationType(otherInstance)) {
				case 'manyToOne':
					q.from(otherTable.tableName)
						.where(`${fk.col} = ?`, this[fk.val]);

					Object.keys(otherModel.table.schema).forEach(f => {
						q.field(`${otherTable.tableName}.${f}`);
					});

					return q.toString();
				case 'oneToMany':
					q.from(otherTable.tableName)
						.where(`${fk.col} = ?`, this[fk.val]);

					Object.keys(otherModel.table.schema).forEach(f => {
						q.field(`${otherTable.tableName}.${f}`);
					});

					return q.toString();
				case 'manyToMany':
					let ok = this.otherKey(otherInstance);
					let jt = this.joinTable(otherInstance);

					q
						.from(otherTable.tableName)
							.join(jt, null, `${otherTable.tableName}.${ok.col} = ${jt}.${ok.val}`)
						.where(`${fk.col}=${this[fk.val]}`);

					Object.keys(otherModel.table.schema).forEach(f => {
						q.field(`${otherTable.tableName}.${f}`);
					});

					return q.toString();
			}
		}]
	});

	return Associate;
}

module.exports = generate;
