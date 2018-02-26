require('dotenv').config();

let { Pool } = require('pg');
let pool = new Pool({
	connectionString: process.env.TEST_DB_URL
});
let { User, BaseCollection } = require('../bootstrap');

describe('Collection', () => {
	let users = new (BaseCollection.of(User))()
		.limit(5)
		.offset(1);

	it('should collect instances', (done) => {
		users.collect()
			.then(u => {
				u[0].should.not.be.null;

				done();
			});
	});
});
