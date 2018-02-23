let should = require('chai').should();
let expect = require('chai').expect;

let  { User } = require('../bootstrap');

module.exports = describe('Model', () => {
	describe('constructor', () => {
		function badConstructor() {
			return new User('Cameron', 25);
		}

		it('should throw on bad arguments', () => {
			return expect(badConstructor).to.throw();
		});
	});

	describe('#save', () => {
		it('should generate correct SQL for new instances', () => {
			let user = new User({ name: 'Cameron', teamId: 10 });
			let expectedSave = `INSERT INTO users (name, team_id) VALUES ('Cameron', 10) ON CONFLICT (user_id) DO UPDATE SET name = 'Cameron', team_id = 10 RETURNING users.user_id, users.name, users.team_id, users.created_at`;

			return user._saveSql().should.equal(expectedSave);
		});

		it('should generate correct SQL for old/ID\'d instances', () => {
			let user = new User({ userId: 2, name: 'Cameron', teamId: 10 });
			let expectedUpdate = `INSERT INTO users (user_id, name, team_id) VALUES (2, 'Cameron', 10) ON CONFLICT (user_id) DO UPDATE SET name = 'Cameron', team_id = 10 RETURNING users.user_id, users.name, users.team_id, users.created_at`;

			return user._saveSql().should.equal(expectedUpdate);
		});
	});

	describe('#update', () => {
		it('should generate correct SQL', () => {
			let user = new User({
				userId: 2,
				name: 'Cameron',
				teamId: 10
			});

			let expectedUpdate = `UPDATE users SET name = 'John' WHERE (user_id = 2) RETURNING users.user_id, users.team_id, users.name, users.created_at`;

			return user._updateSql({ name: 'John' }).should.equal(expectedUpdate);
		})
		
		it('should throw on update to instance without ID', () => {
			let user = new User({
				name: 'Cameron',
				teamId: 10
			});

			function badFunction() {
				return user._updateSql({ name: 'John' });
			}

			return expect(badFunction).to.throw();
		});
	});

	describe('#fetch', () => {
		it('should generate correct SQL', () => {
			let expectedFetch = `SELECT users.user_id, users.team_id, users.name, users.created_at FROM users WHERE (user_id = 2)`;

			let user = new User({
				userId: 2
			});

			return user._fetchSql().should.equal(expectedFetch);
		});
	});

	describe('#clone', () => {
		it('should generate correct SQL', () => {
			let expectedClone = `INSERT INTO users (user_id, name, team_id, created_at) VALUES (DEFAULT, 'Cameron', 10, DEFAULT) RETURNING users.user_id, users.name, users.team_id, users.created_at`;

			let user = new User({
				userId: 2,
				name: 'Cameron',
				teamId: 10
			});

			return user._cloneSql({
				createdAt: '__DEFAULT',
			}).should.equal(expectedClone);
		});
	});

	describe('#delete', () => {
		it('should generate correct SQL', () => {
			let user = new User({
				userId: 2,
				name: 'Cameron',
				teamId: 10
			});
			let expected = 'DELETE FROM users WHERE (users.user_id = 2)';

			return user._deleteSql().should.equal(expected)
		});

		it('should throw if no ID on instance', () => {
			let user = new User({
				name: 'Cameron',
				teamId: 10
			});
			function badFunc() {
				user._deleteSql();
			}

			return expect(badFunc).to.throw();
		});
	});

	describe('#toJSON', () => {
		it('should serialize the model to JSON', () => {
			let user = new User({
				name: 'Cameron',
				teamId: 10
			});

			user.toJSON().should.deep.equal({
				name: 'Cameron',
				teamId: 10
			})
		});
	});
});
