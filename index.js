let { Pool } = require('pg');

/**
* Root of the ORM
* @constructor
* @param {Object} opts - configuration options. Currently, only the `connectionString` param will matter
*/
class ORM {
	constructor(opts) {
		this.pool = new Pool({
			connectionString: opts.dbUrl
		});
	}

	get BaseCollection() {
		return require('./lib/BaseCollection')(this.pool);
	}

	get BaseModel() {
		return require('./lib/BaseModel')(this.pool);
	}

	get Filter() {
		return require('./lib/Filter');
	}

	get Associate() {
		return require('./lib/Associate')(this.pool);
	}

	get Table() {
		return require('./lib/Table');
	}

	get squel() {
		return require('squel');
	}

	query(q) {
		return this.pool.query(q);
	}
}

module.exports = ORM;
