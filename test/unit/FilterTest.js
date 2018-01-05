let assert = require('assert');

let squel = require('squel');
let Filter = require('../../lib/Filter');

let q = squel.select()
	.from('clients');

let foo = new Filter({
	client_id: 1
});

foo.applyToSql(q);
assert(q.toString() === 'SELECT * FROM clients WHERE (client_id = 1)', q.toString());

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
foo.applyToSql(q);
assert(q.toString() === 'SELECT * FROM clients WHERE (name = TeamCo) AND (customer_count > 5) AND (customer_count < 10) AND (employee_count >= 100) AND (employee_count <= 499) AND (archived != null) AND (order IN (1, 2, 3, 4, 5))', `Complex filters failed, should be ${q.toString()}`);

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
console.log('\tFilter tests passed');
