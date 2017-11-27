let Traits = require('protoduck');
let squel = require('squel').useFlavour('postgres');
let BaseCollection = require('../classes/BaseCollection');
let BaseModel = require('../classes/BaseModel');

function generate(pool) {
	let ManyToMany = Traits.define(['otherModel'], {
		foreignKey: ['otherModel'],
		otherKey: ['otherModel'],
		joinTable: ['otherModel'],

		fetch: [async function(otherModel) {
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
			class Temp extends BaseCollection {
				constructor() {}

				static get baseTable() {
					return new Table(this.otherTable(new otherModel()))
				}
			}
			let c = new otherModel.associatedCollection()
				.join(new class extends BaseCollection {
					constructor(filter, joins) {
						super(filter, joins)
					}
				}(), {fk: 'foo', references: 'bar'});

			return c;
		}]
	});

	return ManyToMany;
}

module.exports = generate;
