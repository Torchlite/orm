let assert = require('assert');
let { Pool } = require('pg');
let pool = new Pool({
	connectionString: 'postgres://localhost:5432/testerino'
});

let {
	UserCollection,
	User
} = require('../bootstrap');

let users = new UserCollection();

function collectTest() {
	return Promise.all([
		users.collect(),
		pool.query(`select count(*) from users`)
	])
		.then(u => {
			let count = parseInt(u[1].rows[0].count, 10);
			let collectCount = u[0].length;

			assert(count === collectCount, 'Counts did not match');
			assert(u[0].every(m => m.greet), 'Results do not appear to be users');
		})
		.then(() => {
			console.log('\tcollect succeeded');
		});
}

function findByIdTest() {
	let found;

	return pool.query(`select user_id, name from users limit 1`)
		.then(r => {
			found = {
				id: r.rows[0].user_id,
				name: r.rows[0].name
			};

			return users.findById(found.id);
		})
		.then(u => {
			assert(u.userId === found.id, 'id mismatch');
			assert(u.name === found.name, `name mismatch: Expected ${u.name} but got ${found.name}`);
			assert(u.greet() === `Hello, ${u.name}`, 'bad greeting');
		})
		.then(() => {
			console.log('\tfindById succeeded');
		});
}

function findOneTest() {
	let found;
	return pool.query(`select user_id, name from users limit 1`)
		.then(r => {
			found = {
				id: r.rows[0].user_id,
				name: r.rows[0].name
			};

			return users.findOne();
		})
		.then(u => {
			assert(u.userId === found.id, 'id mismatch');
			assert(u.name === found.name, `name mismatch: Expected ${u.name} but got ${found.name}`);
			assert(u.greet() === `Hello, ${u.name}`, 'bad greeting');
		})
		.then(() => {
			console.log('\tfindOne succeeded');
		});
}

async function addTest() {
	let added = await new UserCollection()
		.filter({
			teamId: 2
		})
		.add(new User({
			teamId: 2,
			name: 'Jimothy'
		}));

	assert(added.teamId === 2, 'Wrong teamId');
	assert(added.name === 'Jimothy', 'Wrong name');
}

async function main() {
	let team10 = new UserCollection()
		.filter({
			teamId: 10
		});

	team10.listen();

	team10.on('add', newUser => {
		console.log(`${newUser.name} was added to the team`);
	});

	team10.on('remove', oldUser => {
		console.log(`${oldUser.name} was removed from the team`);
	});
}

main();

/*module.exports = Promise.all([
	findByIdTest().catch(console.log),
	collectTest().catch(console.log),
	findOneTest().catch(console.log),
	addTest().catch(console.log)
]);*/
