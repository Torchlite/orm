let assert = require('assert');

let squel = require('squel');
let Filter = require('../../lib/Filter');

let q = squel.select()
	.from('clients');

let foo = new Filter({
	client_id: 1
});


q = squel.select()
	.from('clients');
foo = new Filter({
	name: 'TeamCo',
	customer_count: {
		$gt: 5,
		$lt: 10
	},
	employee_count: {
		$gte: 100,
		$lte: 499
	},
	archived: {
		$ne: null
	},
	order: {
		$in: [1, 2, 3, 4, 5]
	}
});

let trueClient = {
	name: 'TeamCo',
	customer_count: 7,
	employee_count: 230,
	archived: false,
	order: 2
};

let falseOrderClient = {
	name: 'TeamCo',
	customer_count: 7,
	employee_count: 230,
	archived: false,
	order: 6
};

let falseClient = {
	name: 'OtherCo',
	customer_count: 7,
	employee_count: 230,
	archived: false,
	order: 4
};

let fooFun = foo.toJsFilter();

assert(fooFun(trueClient), 'trueClient should pass the filter');
assert(!fooFun(falseClient), 'falseClient should fail the filter');
assert(!fooFun(falseOrderClient), 'falseOrderClient should not pass the filter');

let bar = new Filter({
	name: 'TeamCo',
	customer_count: {
		$gt: 10,
		$lt: 20
	}
});

assert(bar.toSql() === `name = 'TeamCo' AND customer_count > 10 AND customer_count < 20`, bar.toSql());

let isNull = new Filter({
	employee_count: {
		$null: true
	}
});

let notNull = new Filter({
	employee_count: {
		$null: false
	}
});

assert(isNull.toSql() === `employee_count is null`, isNull.toSql());
assert(notNull.toSql() === `employee_count is not null`, notNull.toSql());

let likeFilter = new Filter({
	someKey: {
		$like: 'sTu'
	}
})

let likeSqlFilter = likeFilter.toSql();
let likeJsFilter = likeFilter.toJsFilter();

let like1 = likeJsFilter({
	someKey: 'stuff'
});

let like2 = likeJsFilter({
	someKey: 'notthing'
});

let like3 = likeJsFilter({
	notKey: 'sTu'
});

assert(like1 && !like2 && !like3, '`like` jsfilters failed');
assert(likeSqlFilter === `someKey ilike '%sTu%'`);

console.log('\tFilter tests passed');
