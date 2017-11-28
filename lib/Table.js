let squel = require('squel').useFlavour('postgres');

/**
* Low-level abstraction of a database table
* Instances of this class sit behind `BaseModel` and `BaseCollection`
* @constructor
* @param {string} tableName - the name of the database table this represents
* @param {Object} schema - the schema of the database table, with keys representing columns and values being objects containing descriptive information
*/
class Table {
	constructor(tableName, schema) {
		this.tableName = tableName;
		this.schema = schema;
	}

  /** The primary key of the table, derived from the schema */
	get pkey() {
		return Object.keys(this.schema).find(k => this.schema[k].isPrimaryKey);
	}

  /** Return a squel select from the table */
	select() {
		return squel.select()
			.from(this.tableName);
	}

  /** Return a squel insert into the table */
	insert() {
		return squel.insert()
			.into(this.tableName);
	}

  /** Return a squel update of the table */
	update() {
		return squel.update()
			.table(this.tableName);
	}
}

module.exports = Table;
