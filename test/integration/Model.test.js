require('dotenv').config();

let { Pool } = require('pg');
let pool = new Pool({
	connectionString: process.env.TEST_DB_URL
});
let { User } = require('../bootstrap');

let testUsers = [
	new User({ name: 'John' }),
	new User({ name: 'Bill', teamId: 2 }),
	new User({ name: 'صلى الله عليه وسلم' }),
	new User({ name: 'John\'; DROP TABLE users' }),
	new User({ name: '💩' }),
	new User({ name: 'Who%s/\/Want\'s to know? $1' }),
	new User({ name: 'Pogo', metadata: {
		logins: 15,
		otherThing: {
			foobar: 'stuff'
		}
	}})
];

describe('Model', () => {
	testUsers.forEach(u => {
		describe(`#save (${u.name})`, () => {
			let savePromise = u.save();

			it('should save a new instance without error', (done) => {
				savePromise.then(saved => {
					saved.name.should.be.equal(u.name);
					done();
				}).catch(done);
			});

			it('should give a new ID', (done) => {
				savePromise.then(saved => {
					saved.userId.should.not.be.undefined;
					saved.userId.should.not.be.null;

					done();
				});
			});

			it('should return an instance of the correct class', (done) => {
				savePromise.then(saved => {
					saved.greet().should.be.equal(`Hello, ${u.name}`);
					done();
				}).catch(done);
			});

			it('should be in the database afterwards', (done) => {
				let id;
				savePromise
					.then(saved => {
						id = saved.userId;

						let q = `select * from users where user_id = ${id}`;

						return pool.query(q);
					})
					.then(result => {
						result.rows[0].user_id.should.be.equal(id);
						result.rows[0].name.should.be.equal(u.name);

						result.rows[0].metadata && result.rows[0].metadata.should.deep.equal(u.metadata);

						done();
					}).catch(done);
			});
		});
	});

	describe('#fetch', () => {
		let expected;
		let theUser;

		let fetchQuery = pool.query(`select user_id, name from users limit 1`)
			.then(results => {
				return {
					id: results.rows[0].user_id,
					name: results.rows[0].name
				};
			})
			.then(exp => {
				expected = exp;
				theUser = User.fromId(exp.id);
				return theUser.fetch();
			});

		it('should resolve without error', (done) => {
			fetchQuery
				.then(() => done())
				.catch(done);
		});

		it('should return the expected instance', (done) => {
			fetchQuery
				.then(found => {
					found.userId.should.be.equal(expected.id);
					found.name.should.be.equal(expected.name);
					found.greet().should.be.equal(`Hello, ${expected.name}`);

					done();
				})
				.catch(done);
		});

		it('should fill out the fetched model', (done) => {
			fetchQuery
				.then(() => {
					theUser.userId.should.be.equal(expected.id);
					theUser.name.should.be.equal(expected.name);
					theUser.greet().should.be.equal(`Hello, ${expected.name}`);

					done();
				})
				.catch(done);
		});
	});
});
