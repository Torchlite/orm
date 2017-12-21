let Traits = require('protoduck');
let squel = require('squel').useFlavour('postgres');
let Filter = require('./Filter');

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

		get: [function (otherModel, filter) {
			let otherInstance = new otherModel();

			return pool.query(this._getSql(otherModel, new Filter(filter)))
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

		_getSql: [function (otherModel, filter) {
			let otherTable = otherModel.table;
			let otherInstance = new otherModel();
			let fk = this.foreignKey(otherInstance);

			let q = squel.select();

			switch (this.associationType(otherInstance)) {
				case 'oneToMany':
					q.from(otherTable.tableName)
						.where(`${fk.col} = ?`, this[fk.val]);

					if (filter) {
						q.where(filter.toSql());
					}

					Object.keys(otherModel.table.schema).forEach(f => {
						q.field(`${otherTable.tableName}.${f}`);
					});

					return q.toString();
				case 'manyToOne':
					q.from(otherTable.tableName)
						.where(`${fk.col} = ?`, this[fk.val]);

					if (filter) {
						q.where(filter.toSql());
					}

					Object.keys(otherModel.table.schema).forEach(f => {
						q.field(`${otherTable.tableName}.${f}`);
					});

					return q.toString();
				case 'manyToMany':
					let ok = this.otherKey(otherInstance);
					let jt = this.joinTable(otherInstance).tableName;

					q
						.from(otherTable.tableName)
							.join(jt, null, `${otherTable.tableName}.${ok.col} = ${jt}.${ok.col}`)
						.where(`${fk.col}=${this[fk.val]}`);

					if (filter) {
						q.where(filter.toSql());
					}

					Object.keys(otherModel.table.schema).forEach(f => {
						q.field(`${otherTable.tableName}.${f}`);
					});

					return q.toString();
			}
		}],

		add: [function (otherInstance) {
			return pool.query(this._addSql(otherInstance));
		}],

		_addSql: [function (otherInstance, ctx) {
			let fk = this.foreignKey(otherInstance);

			switch (this.associationType(otherInstance)) {
				case 'oneToMany':
					return squel.update()
						.table(otherInstance.constructor.table.tableName)
						.set(fk.col, this[fk.val])
						.where(`${otherInstance.constructor.table.pkey} = ?`, otherInstance._id())
						.toString();

				case 'manyToOne':
					return squel.update()
						.table(this.constructor.table.tableName)
						.set(fk.col, otherInstance[fk.val])
						.where(`${this.constructor.table.pkey} = ?`, this._id())
						.toString();

				case 'manyToMany':
					let ok = this.otherKey(otherInstance);
					let jt = this.joinTable(otherInstance).tableName;

					return squel.insert()
						.into(jt)
						.set(fk.col, this._id())
						.set(ok.col, otherInstance._id())
						.toString();
			}
		}]
	});

	return Associate;
}

module.exports = generate;
