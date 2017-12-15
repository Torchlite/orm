'use strict';
let assert = require('assert');

let {
	User,
	UserCollection,
	Team,
	TeamCollection,
	GameCollection
} = require('./bootstrap');

let user = new User({ id: null, name: 'Cameron', teamId: 10 });
let user2 = new User({ id: 2, name: 'Cameron', teamId: 10 });

assert(user.saveSql() === `INSERT INTO users (name, team_id) VALUES ('Cameron', 10) ON CONFLICT (user_id) DO UPDATE SET name = 'Cameron', team_id = 10`, 'Create query is wrong');
assert(user2.saveSql() === `INSERT INTO users (user_id, name, team_id) VALUES (2, 'Cameron', 10) ON CONFLICT (user_id) DO UPDATE SET name = 'Cameron', team_id = 10`, `Update query is wrong: ${user2.saveSql()}`);
