let assert = require('assert');
let should = require('chai').should();
let expect = require('chai').expect;

let  { User, Game, BaseCollection } = require('../bootstrap');

let users = new (BaseCollection.of(User))();
let games = new (BaseCollection.of(Game))()
	.filter({
		date: {
			$gt: '2017-01-01',
			$lt: '2017-01-31'
		},
		winner: 2
	})
	.filter({
		valid: {
			$ne: false
		}
	})
	.filter({
		gameId: 1
	})
	.limit(10)
	.offset(55)
	.sort('gameId', 'desc');

describe('Collection', () => {
	describe('#of', () => {
		it('should generate a Collection with the appropriate class', () => {
			assert(BaseCollection.of(User).associatedClass === User);
		});
	});

	describe('#filter', () => {
		let c = new (BaseCollection.of(User))()
			.filter({
				name: 'John'
			});

		it('should return a new Collection extended with a filter', () => {
			return c.filterObject.obj.should.be.deep.equal({
				name: 'John'
			});
		});

		it('should generate correct SQL', () => {
			let simpleFilterExpected = `SELECT users.user_id, users.team_id, users.name, users.created_at FROM users WHERE (name = 'John')`;
			return c._collectSql.toString().should.equal(simpleFilterExpected);
		})
	});

	describe('#limit', () => {
		it('should throw on non-number limit', () => {
			function badFunction() {
				return users.limit('seven');
			}

			return expect(badFunction).to.throw();
		});

		it('should throw on negative limit', () => {
			function badFunction() {
				return users.limit(-1);
			}

			return expect(badFunction).to.throw();
		});

		it('should throw on NaN', () => {
			function badFunction() {
				return users.limit(NaN);
			}

			return expect(badFunction).to.throw();
		});

		it('should return a new Collection, extended with limit', () => {
			let c = new (BaseCollection.of(User))()
				.limit(10);

			return c._limit.should.equal(10);
		});
	});

	describe('#offset', () => {
		it('should throw on non-number offset', () => {
			function badFunction() {
				return users.offset('seven');
			}

			return expect(badFunction).to.throw();
		});

		it('should throw on negative offset', () => {
			function badFunction() {
				return users.offset(-1);
			}

			return expect(badFunction).to.throw();
		});

		it('should throw on NaN', () => {
			function badFunction() {
				return users.offset(NaN);
			}

			return expect(badFunction).to.throw();
		});

		it('should return a new Collection, extended with offset', () => {
			let c = new (BaseCollection.of(User))()
				.offset(10);

			return c._offset.should.equal(10);
		});
	});

	describe('#sort', () => {
		it('should throw on non-string sort key', () => {
			function badFunction() {
				return users.sort(2);
			}

			return expect(badFunction).to.throw();
		});

		it('should throw on invalid sort direction', () => {
			function badFunction() {
				return new (BaseCollection.of(User))()
					.sort('name', 'foobar');
			}

			return expect(badFunction).to.throw();
		});

		it('should return a new Collection, extended with sort', () => {
			let c = new (BaseCollection.of(User))()
				.sort('name', 'asc');

			return c._order.should.be.deep.equal({
				key: 'name',
				direction: 'asc'
			});
		});
	});

	describe('#_collectSql', () => {
		it('should generate correct sql', () => {
			let games = new (BaseCollection.of(Game))()
				.filter({
					date: {
						$gt: '2017-01-01',
						$lt: '2017-01-31'
					},
					winner: 2
				})
				.filter({
					valid: {
						$ne: false
					}
				})
				.filter({
					gameId: 1
				})
				.limit(10)
				.offset(55)
				.sort('gameId', 'desc');
		});

		let expected = `SELECT games.game_id, games.date FROM games WHERE (date > '2017-01-01' AND date < '2017-01-31' AND winner = 2 AND valid != FALSE AND game_id = 1) ORDER BY game_id DESC LIMIT 10 OFFSET 55`;

		return games._collectSql.toString().should.be.equal(expected);
	});

	describe('#_countSql', () => {
		it('should generate the correct sql', () => {
			let users = new (BaseCollection.of(User))();

			return users._countSql().toString().should.be.equal('SELECT count(*) FROM users');
		})
	});
});
