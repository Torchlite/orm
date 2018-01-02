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
		let c = require('./lib/BaseCollection');
		c.init(this.pool);
		return c;
	}

	get BaseModel() {
		let m = require('./lib/BaseModel');
		m.init(this.pool);
		return m;
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
