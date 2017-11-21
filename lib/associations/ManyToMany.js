let Traits = require('protoduck');
let squel = require('squel').useFlavour('postgres');
let BaseCollection = require('../BaseCollection');
let BaseModel = require('../BaseModel');

function generate(pool) {
	let ManyToMany = Traits.define(['otherModel'], {
		foreignKey: ['otherModel'],
		otherKey: ['otherModel'],
		joinTable: ['otherModel'],

		async fetch: [function(otherModel) {
			let otherTable = otherModel.associatedCollection.tableName;
			let otherInstance = new otherModel();

			let jt = this.joinTable(otherInstance);
			let fk = this.foreignKey(otherInstance);
			let ok = this.otherKey(otherInstance);

			let q = squel.select()
				.from(otherTable)
					.join(jt, null, `${otherTable}.${ok} = ${jt}.${ok}`)
				.where(`${fk}=${this[fk]}`);

			return pool.query(q.toString())
				.then(results => {
					return result.rows.map(r => otherModel.fromSql(r))
				});
		}],

		get: [function(otherModel) {
			assert(false, '`get` for many-to-many relationships is not yet implemented');
		}]
	});

	return ManyToMany;
}

module.exports = generate;
