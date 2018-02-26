let Filter = require('../../lib/Filter');
require('chai').should();

let correctSql = (filter, sql) => {
	return  it('should generate correct SQL', () => {
		return filter.toSql().should.equal(sql);
	});
};

let correctFunction = (filter, posTest, negTest) => {
	let func = filter.toJsFilter();

	it('should return a function', () => {
		return func.should.be.a('function');
	});

	it('should return false for the negative test', () => {
		return func(negTest).should.equal(false);
	});

	it('should return true for the positive test', () => {
		return func(posTest).should.equal(true);
	});
};

module.exports = describe('Filter', () => {
	describe('equal query', () => {
		let f = new Filter({
			stuff: 'Things',
			other_stuff: 'more things',
			truthy: true,
			falsy: false
		});

		let negTest = {
			stuff: 'not things',
			other_stuff: 'more things',
			truthy: true,
			falsy: false
		};

		let posTest = {
			stuff: 'Things',
			other_stuff: 'more things',
			truthy: true,
			falsy: false
		};

		describe('#toSql', () => correctSql(f, `stuff = 'Things' AND other_stuff = 'more things' AND truthy AND NOT falsy`))
		describe('#toJsFilter', () => correctFunction(f, posTest, negTest));
	});

	describe('greater/less than/equal', () => {
		let f = new Filter({
			age: {
				$gt: 25,
				$lt: 40
			},
			weight: {
				$lte: 250,
				$gte: 100
			},
			name: 'Cameron'
		});

		let posTest = {
			name: 'Cameron',
			age: 28,
			weight: 250
		};

		let negTest = {
			name: 'Cameron',
			age: 41,
			weight: 251
		};

		describe('#toSql', () => correctSql(f, `age > 25 AND age < 40 AND weight <= 250 AND weight >= 100 AND name = 'Cameron'`))
		describe('#toJsFilter', () => correctFunction(f, posTest, negTest));
	});

	describe('not equal', () => {
		let f = new Filter({
			name: {
				$ne: 'Cameron'
			}
		});

		let posTest = {
			name: 'Jim'
		};

		let negTest = {
			name: 'Cameron'
		};

		describe('#toSql', () => correctSql(f, `name != 'Cameron'`))
		describe('#toJsFilter', () => correctFunction(f, posTest, negTest));
	});

	describe('null/not null', () => {
		let f = new Filter({
			name: {
				$null: false
			},
			age: {
				$null: true
			}
		});

		let posTest = {
			name: 'Cameron',
			age: null
		};

		let negTest = {
			name: 'Cameron',
			age: 28
		};

		f.toJsFilter()(posTest);

		describe('#toSql', () => correctSql(f, `name is not null AND age is null`))
		describe('#toJsFilter', () => correctFunction(f, posTest, negTest));
	});

	describe('like', () => {
		let f = new Filter({
			name: {
				$like: 'cam'
			}
		});

		let posTest = {
			name: 'Cameron'
		};

		let negTest = {
			name: 'Jim'
		};

		describe('#toSql', () => correctSql(f, `name ilike '%cam%'`))
		describe('#toJsFilter', () => correctFunction(f, posTest, negTest));
	});

	describe('in', () => {
		let f = new Filter({
			some_num: {
				$in: [1,2,3,4]
			}
		});

		let posTest = {
			some_num: 3
		};

		let negTest = {
			some_num: 6
		};

		describe('#toSql', () => correctSql(f, `some_num IN (1, 2, 3, 4)`))
		describe('#toJsFilter', () => correctFunction(f, posTest, negTest));
	})
});
