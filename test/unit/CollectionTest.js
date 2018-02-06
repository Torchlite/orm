'use strict';
let assert = require('assert');

let {
	UserCollection,
	GameCollection
} = require('../bootstrap');

let users = new UserCollection();
let camerons = users.filter({ name: 'Cameron' });

let games = new GameCollection()
	.filter({
		date: {
			$gt: '2017-01-01',
			$lt: '2017-01-31'
		},
		winner: 2
	})
	.filter({
		valid: {
			$ne: false
		}
	})
	.filter({
		gameId: 1
	})
	.limit(10)
	.offset(55)
	.sort('gameId', 'desc');

let simpleExpected = 'SELECT users.user_id, users.team_id, users.name, users.created_at FROM users';
let simpleFilterExpected = `SELECT users.user_id, users.team_id, users.name, users.created_at FROM users WHERE (name = 'Cameron')`;

assert(users.toSql() === simpleExpected, `Simple unfiltered was wrong:
	right: ${simpleExpected}
	found: ${
users.toSql()}`);

assert(camerons.toSql() === simpleFilterExpected, `Simple filter incorrect:
	right: ${simpleFilterExpected}
	found: ${camerons.toSql()}
`);
assert(games.toSql() === `SELECT games.game_id, games.date FROM games WHERE (date > '2017-01-01' AND date < '2017-01-31' AND winner = 2 AND valid != FALSE AND game_id = 1) ORDER BY game_id DESC LIMIT 10 OFFSET 55`, `Complex filter failed:
	${games.toSql()}
	SELECT games.game_id, games.date FROM games WHERE (date > '2017-01-01' AND date < '2017-01-31' AND winner = 2 AND valid != FALSE AND game_id = 1) ORDER BY game_id DESC LIMIT 10 OFFSET 55`);

assert(users._countSql() === 'SELECT count(*) FROM users', users._countSql());
assert(camerons._countSql() === `SELECT count(*) FROM users WHERE (name = 'Cameron')`, users._countSql());

let independentCamerons = new UserCollection()
	.filter({
		name: 'Cameron',
		teamId: {
			$null: true
		}
	});

console.log(independentCamerons.toSql());

console.log('\tCollection tests passed');
