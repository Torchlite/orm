class BaseModel {
	constructor() {}
	static get table() {
		throw new Error('A model must be backed by a table, but this one is not');
	}

	static fromSqlRow(row) {
		throw new Error('Must implement `fromSqlRow`');
	}
}

module.exports = BaseModel;
