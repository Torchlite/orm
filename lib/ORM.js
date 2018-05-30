let { Pool } = require('pg');
let PGPubSub = require('pg-pubsub');

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

		if (opts.live === undefined) {
			opts.live = true
		}

		if (opts.live) {
			this.pubsubInstance = new PGPubSub(opts.dbUrl);
		}
	}

	get BaseCollection() {
		let c = require('./BaseCollection');
		c.init(this.pool);
		return c;
	}

	get BaseModel() {
		let m = require('./BaseModel');
		m.init(this.pool);
		return m;
	}

	get Filter() {
		return require('./Filter');
	}

	get Associate() {
		return require('./Associate')(this.pool);
	}

	get Table() {
		let Table = require('./Table');
		Table.init(this.pubsubInstance, this.pool);

		return Table;
	}

	get squel() {
		return require('squel');
	}
}

module.exports = ORM;
