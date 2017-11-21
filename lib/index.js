let { Client, Pool } = require('pg');

class ORM {
	constructor(opts) {
		this.pool = new Pool({
			connectionString: opts.dbUrl
		});
	};

	get BaseCollection() {
		return require('./classes/BaseCollection')(this.pool);
	}

	get BaseModel() {
		return require('./classes/BaseModel');
	}

	get Filter() {
		return require('./classes/Filter');
	}

	get ManyToMany() {
		return require('./associations/ManyToMany');
	}

	get OneToMany() {
		return require('./associations/OneToMany');
	}

	get ManyToOne() {
		return require('./associations/ManyToOne');
	}
}

module.exports = ORM;
