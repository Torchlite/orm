let assert = require('assert');

let squel = require('squel');
let Filter = require('../lib/Filter');

let q = squel.select()
	.from('clients');

let foo = new Filter({
	client_id: 1
});

foo.applyToSql(q);

let func = foo.toJsFilter();

assert(func({
	client_id: 1
}));

assert(!func({
	client_id: 2
}));
