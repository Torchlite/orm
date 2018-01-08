let assert = require('assert');

let {
	User,
	UserCollection,
	TeamCollection
} = require('../bootstrap');

function saveTest() {
	let u = new User({ teamId: 10, name: 'Cameron' });

	return u.save()
		.then(u => {
			assert(u.userId, 'No ID on the saved model');
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
			assert(r.userId, 'No ID on the updated model');
			assert(r.teamId, 'No teamId on the updated model result');
			assert(r.name === 'Jebediah', 'name incorrect');
			assert(r.greet() === 'Hello, Jebediah', 'greeting incorrect');
		})
		.then(() => console.log('\tupdate succeeded'));
}

function m1AddTest() {
	let user;
	let team;

	return Promise.all([
		new UserCollection().findOne(),
		new TeamCollection().findOne()
	])
		.then(([u, t]) => {
			user = u;
			team = t;

			user.teamId = null;
			return user.save()
				.then(saved => {
					assert(saved.teamId === null, saved.teamId);
				});
		})
		.then(() => user.add(team))
		.then(() => new UserCollection().findById(user.userId))
		.then(newUser => {
			assert(newUser.teamId === team.teamId, 'user has the wrong teamId');
		})
		.then(() => console.log('\t`add` (manyToOne) succeeded'))
		.catch(console.log);
}

function _1mAddTest() {
	let user;
	let team;

	return Promise.all([
		new UserCollection().findOne(),
		new TeamCollection().findOne()
	])
		.then(([u, t]) => {
			user = u;
			team = t;

			user.teamId = null;
			return user.save()
				.then(saved => {
					assert(saved.teamId === null, saved.teamId);
				});
		})
		.then(() => team.add(user))
		.then(() => new UserCollection().findById(user.userId))
		.then(newUser => {
			assert(newUser.teamId === team.teamId, 'user has the wrong teamId');
		})
		.then(() => console.log('\t`add` (oneToMany) succeeded'))
		.catch(console.log);
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
	m1AddTest(),
	_1mAddTest(),
	cloneTest()
]);

