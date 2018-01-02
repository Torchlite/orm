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

		get: [function (otherModel, filter = {}) {
			let otherInstance = new otherModel();

			let limit = filter.limit ? parseInt(filter.limit, 10) : null;
			let offset = filter.offset ? parseInt(filter.offset, 10) : null;

			delete filter.limit;
			delete filter.offset;

			return pool.query(this._getSql(otherModel, new Filter(filter), limit, offset))
				.then(res => {
					switch (this.associationType(otherInstance)) {
						case 'manyToOne':
							return otherModel.fromSQLRow(res.rows[0]);
						case 'manyToMany':
						case 'oneToMany':
							return res.rows.map(r => otherModel.fromSQLRow(r));
					}
				});
		}],

		_getSql: [function (otherModel, filter, limit, offset) {
			let otherTable = otherModel.table;
			let otherInstance = new otherModel();
			let fk = this.foreignKey(otherInstance);

			let q = squel.select();

			if (limit) {
				q.limit(limit);
			}

			if (offset) {
				q.offset(offset);
			}

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
					let jt = this.joinTable(otherInstance);

					q
						.from(otherTable.tableName)
							.join(jt.tableName, null, `${otherTable.tableName}.${ok.col} = ${jt.tableName}.${ok.col}`)
						.where(`${fk.col}=${this[fk.val]}`);

					if (filter) {
						q.where(filter.toSql());
					}

					Object.keys(otherModel.table.schema).forEach(f => {
						q.field(`${otherTable.tableName}.${f}`);
					});

					Object.keys(jt.schema).forEach(k => {
						q.field(`${jt.tableName}.${k}`, `__context_${k}`);
					});

					return q.toString();
			}
		}],

		add: [function (otherInstance, ctx) {
			return pool.query(this._addSql(otherInstance, ctx));
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
					let jt = this.joinTable(otherInstance);

					let q = squel.insert()
						.into(jt.tableName)
						.set(fk.col, this._id())
						.set(ok.col, otherInstance._id());

					if (ctx) {
						Object.keys(ctx).forEach(k => {
							q.set(k, ctx[k]);
						});
					}

					Object.keys(jt.schema).forEach(k => {
						q.returning(k);
					});

					return q.toString();
			}
		}]
	});

	return Associate;
}

module.exports = generate;
