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

	describe('#findOne', () => {
		it('should return an instance', (done) => {
			users.findOne()
				.then(u => {
					/Hello, .*/.test(u.greet()).should.be.equal(true);
					done();
				})
				.catch(done);
		});

		it('should work with a filter', (done) => {
			users.findOne({ teamId: 2 })
				.then(u => {
					u.teamId.should.be.equal(2);
					done();
				})
				.catch(done);
		})
	});

	describe('#findById', async () => {
		it ('should return the correct user', (done) => {
			let base;
			let test;

			users.findOne()
				.then(u => {
					base = u;

					return users.findById(base.userId);
				})
				.then(tu => {
					tu.userId.should.equal(base.userId);
					tu.name.should.equal(base.name);
					done();
				})
				.catch(done);
		});
	});

	describe('#remove', async () => {
		it('should throw', (done) => {
			users.findOne()
				.then(u => users.remove(u))
				.then(() => {
					throw new Error('Should have failed');
					done('Failed');
				})
				.catch(e => e.message.should.equal('Not implemented; use `delete` in the instance.'))
				.then(() => done());
		});
	});
});
