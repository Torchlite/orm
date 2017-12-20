'use strict';
let assert = require('assert');

let {
	User
} = require('../bootstrap');

let user = new User({ id: null, name: 'Cameron', teamId: 10 });
let user2 = new User({ id: 2, name: 'Cameron', teamId: 10 });

assert(user._saveSql() === `INSERT INTO users (user_id, team_id, name) VALUES (DEFAULT, 10, 'Cameron') ON CONFLICT (user_id) DO UPDATE SET team_id = 10, name = 'Cameron' RETURNING user_id, team_id, name`, `Create query is wrong: ${user._saveSql()}`);
assert(user2._saveSql() === `INSERT INTO users (user_id, team_id, name) VALUES (2, 10, 'Cameron') ON CONFLICT (user_id) DO UPDATE SET team_id = 10, name = 'Cameron' RETURNING user_id, team_id, name`, `Update query is wrong: ${user2._saveSql()}`);

assert(user2._updateSql({ name: 'John' }) === `UPDATE users SET name = 'John' WHERE (user_id = 2) RETURNING user_id, team_id, name`, `Update query is wrong: ${user2._updateSql({ name: 'John' })}`);
