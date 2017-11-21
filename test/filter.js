let assert = require('assert');

let squel = require('squel');
let Filter = require('../lib/classes/Filter');

let q = squel.select()
	.from('clients');

let foo = new Filter({
	client_id: 1
});

foo.applyToSql(q);
assert(q.toString() === 'SELECT * FROM clients WHERE (client_id = 1)', q.toString())

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
	orders: {
		$in: [1,3,5,11]
	}
});
foo.applyToSql(q);

assert(q.toString() === 'SELECT * FROM clients WHERE (name = TeamCo) AND (customer_count > 5) AND (customer_count < 10) AND (employee_count >= 100) AND (employee_count <= 499) AND (archived != null) AND (orders IN 1,3,5,11)', 'Complex filters failed');
