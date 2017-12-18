'use strict';
let assert = require('assert');

let {
	User,
	UserCollection,
	Team,
	TeamCollection,
	GameCollection
} = require('./bootstrap');

let users = new UserCollection();
let camerons = users.filter({ name: 'Cameron' });

let teams = new TeamCollection()
	.filter({ name: 'Buttkickers' });

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
	.offset(55);

assert(users.toSql() === 'SELECT user_id, team_id, name FROM users', 'Simple unfiltered returned ' + users.toSql());
assert(camerons.toSql() === `SELECT user_id, team_id, name FROM users WHERE (name = 'Cameron')`, 'Simple filter returned ' + camerons.toSql());
assert(games.toSql() === `SELECT game_id, team_id, date FROM games WHERE (date > '2017-01-01' AND date < '2017-01-31' AND winner = 2 AND valid != FALSE) LIMIT 10 OFFSET 55`, 'Complex filter failed: ' + games.toSql());
