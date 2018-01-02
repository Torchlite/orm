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
	.limit(10)
	.offset(55)
	.sort('gameId', 'desc');

assert(users.toSql() === 'SELECT user_id, team_id, name FROM users', 'Simple unfiltered returned ' + users.toSql());
assert(camerons.toSql() === `SELECT user_id, team_id, name FROM users WHERE (name = 'Cameron')`, 'Simple filter returned ' + camerons.toSql());
assert(games.toSql() === `SELECT game_id, team_id, date FROM games WHERE (date > '2017-01-01' AND date < '2017-01-31' AND winner = 2 AND valid != FALSE) ORDER BY game_id DESC LIMIT 10 OFFSET 55`, 'Complex filter failed: ' + games.toSql());

assert(users._countSql() === 'SELECT count(*) FROM users', users._countSql());
assert(camerons._countSql() === `SELECT count(*) FROM users WHERE (name = 'Cameron')`, users._countSql());
