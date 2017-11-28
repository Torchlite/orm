let { Client, Pool } = require('pg');

class ORM {
	constructor(opts) {
		this.pool = new Pool({
			connectionString: opts.dbUrl
		});
	};

	get BaseCollection() {
		return require('./BaseCollection')(this.pool);
	}

	get BaseModel() {
		return require('./BaseModel');
	}

	get Filter() {
		return require('./Filter');
	}

	get Associate() {
		return require('./Associate');
	}

	get Table() {
		return require('./Table');
	}

	get squel() {
		return require('squel');
	}
}

module.exports = ORM;
