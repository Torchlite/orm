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

	get Table() {
		return require('./classes/Table');
	}

	get Filter() {
		return require('./classes/Filter');
	}

	get ManyToMany() {
		console.log(`You probably shouldn't be using associations yet!`);
		return require('./associations/ManyToMany');
	}

	get OneToMany() {
		console.log(`You probably shouldn't be using associations yet!`);
		return require('./associations/OneToMany');
	}

	get ManyToOne() {
		console.log(`You probably shouldn't be using associations yet!`);
		return require('./associations/ManyToOne')(this.pool);
	}

	get squel() {
		return require('squel');
	}
}

module.exports = ORM;
