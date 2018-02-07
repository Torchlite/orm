let assert = require('assert');

let {
	User,
	UserCollection,
	TeamCollection
} = require('../bootstrap');

function saveTest() {
	let u = new User({ teamId: 6, name: 'Cameron' });

	return u.save()
		.then(u => {
			assert(u.userId, 'No ID on the saved model');
			assert(u.teamId === 6, 'teamId incorrect');
			assert(u.name === 'Cameron', 'name incorrect');
			assert(u.greet() === 'Hello, Cameron', 'greeting incorrect');
		})
		.then(() => console.log('\tsave succeeded'));
}

function updateTest() {
	return new UserCollection()
		.filter({
			teamId: {
				$null: false
			}
		}).findOne()
		.then(u => u.update({ name: 'Jebediah' }))
		.then(r => {
			assert(r.userId, 'No ID on the updated model');
			assert(r.teamId, 'No teamId on the updated model result');
			assert(r.name === 'Jebediah', 'name incorrect');
			assert(r.greet() === 'Hello, Jebediah', 'greeting incorrect');
		})
		.then(() => console.log('\tupdate succeeded'));
}

async function cloneTest() {
	let user = await new UserCollection().findOne();

	return user.clone()
		.then(newUser => {
			assert(newUser.userId !== user.userId);
			assert(newUser.name === user.name);
			assert(newUser.teamId === user.teamId);
		})
		.then(() => console.log('\tclone succeeded'))
		.catch(console.log);
}

module.exports = Promise.all([
	saveTest(),
	updateTest(),
	cloneTest()
]);
