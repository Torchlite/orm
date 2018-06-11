let EventEmitter = require('events');
let squel = require('squel').useFlavour('postgres');
let performQuery = require('./performQuery');

/**
* Low-level abstraction of a database table
* Instances of this class sit behind `BaseModel` and `BaseCollection`
* @constructor
* @param {string} tableName - the name of the database table this represents
* @param {Object} schema - the schema of the database table, with keys representing columns and values being objects containing descriptive information
*/
class Table extends EventEmitter {
	constructor(tableName, schema) {
		super();
		this.tableName = tableName;
		this.schema = schema;

		if(this.constructor.pubsubInstance) {
			this.constructor.pubsubInstance.addChannel(tableName, msg => {
				let op = msg.op;
				let full = msg.full;

				if (!!!full) {
					let q = squel.select()
						.from('orm_outbox.outbox')
						.where(`id = ${msg.id}`);

					return performQuery(q, this.constructor.pool)
						.then(result => {
							let details = {
								old: result.rows[0].msg.old,
								new: result.rows[0].msg.new,
								full: true
							};

							return this.emit(op, details);
						})
						.catch(e => console.log(`An error occurred while fetching a large message\n\t${e.message}`));
				}

				let details = { old: msg.old, new: msg.new, full: msg.full };

				return this.emit(op, details);
			});
		}
	}

	static init (pubsubInstance, pool) {
		this.pubsubInstance = pubsubInstance;
		this.pool = pool;
	}

  /** The primary key of the table, derived from the schema */
	get pkey() {
		return Object.keys(this.schema).find(k => this.schema[k].isPrimaryKey);
	}
}

module.exports = Table;
