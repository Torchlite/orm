let assert = require('assert');

let {
	User,
	UserCollection
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
	return new UserCollection().findOne()
		.then(u => u.update({ name: 'Jebediah' }))
		.then(r => {
			assert(r.id, 'No ID on the updated model');
			assert(r.teamId, 'No teamId on the updated model result');
			assert(r.name === 'Jebediah', 'name incorrect');
			assert(r.greet() === 'Hello, Jebediah', 'greeting incorrect');
		});
}

module.exports = Promise.all([
	saveTest(),
	updateTest()
]);

