let assert = require('assert');
let { Pool } = require('pg');
let pool = new Pool({
	connectionString: 'postgres://localhost:5432/testerino'
});

let {
	User,
	UserCollection,
	Team,
	TeamCollection,
	GameCollection
} = require('./bootstrap');

function saveTest() {
	let u = new User({ teamId: 10, name: 'Cameron' });

	return u.save()
		.then(u => {
			assert(u.id, 'No ID on the saved model');
			assert(u.teamId === 10, 'teamId incorrect');
			assert(u.name === 'Cameron', 'name incorrect');
			assert(u.greet() === 'Hello, Cameron', 'greeting incorrect');
		})
		.then(() => console.log('\tsave succeeded'));
}

function updateTest() {
	return new users().findOne()
		.then(u => {
			let 
		});
}

module.exports = Promise.all([
	saveTest()
]);

