let squel = require('squel').useFlavour('postgres');

class Table {
	constructor(tableName, schema) {
		this.tableName = tableName;
		this.schema = schema;
	}

	get pkey() {
		return Object.keys(this.schema).find(k => this.schema[k].isPrimaryKey);
	}

	select() {
		return squel.select()
			.from(this.tableName);
	}

	insert() {
		return squel.insert()
			.into(this.tableName);
	}

	update() {
		return squel.update()
			.table(this.tableName);
	}
}

module.exports = Table;
