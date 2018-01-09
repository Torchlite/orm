'use strict';
let assert = require('assert');

let {
	User
} = require('../bootstrap');

let user = new User({ name: 'Cameron', teamId: 10 });
let user2 = new User({ userId: 2, name: 'Cameron', teamId: 10 });

assert(user._saveSql() === `INSERT INTO users (team_id, name) VALUES (10, 'Cameron') ON CONFLICT (user_id) DO UPDATE SET team_id = 10, name = 'Cameron' RETURNING user_id, team_id, name, created_at`, `Create query is wrong: ${user._saveSql()}`);
assert(user2._saveSql() === `INSERT INTO users (user_id, team_id, name) VALUES (2, 10, 'Cameron') ON CONFLICT (user_id) DO UPDATE SET team_id = 10, name = 'Cameron' RETURNING user_id, team_id, name, created_at`, `Update query is wrong: ${user2._saveSql()}`);
assert(user2._updateSql({ name: 'John' }) === `UPDATE users SET name = 'John' WHERE (user_id = 2) RETURNING user_id, team_id, name, created_at`, `Update query is wrong: ${user2._updateSql({ name: 'John' })}`);
assert(user2._fetchSql() === `SELECT users.user_id, users.team_id, users.name, users.created_at FROM users WHERE (user_id = 2)`);

let sql1 = user._cloneSql({ userId: '__DEFAULT', createdAt: '__DEFAULT' });
let cloneSql2 = user._cloneSql();

assert(sql1 === `INSERT INTO users (name, team_id, user_id, created_at) VALUES ('Cameron', 10, DEFAULT, DEFAULT) RETURNING user_id, name, team_id, created_at`, `Clone SQL is wrong: ${sql1}`);
assert(cloneSql2 === `INSERT INTO users (name, team_id, user_id) VALUES ('Cameron', 10, DEFAULT) RETURNING user_id, name, team_id, created_at`, `Clone SQL (no argument) is wrong: ${cloneSql2}`);
console.log('\tModel tests passed');
