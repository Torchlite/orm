'use strict';
let assert = require('assert');

let {
	User
} = require('../bootstrap');

let user = new User({ name: 'Cameron', teamId: 10 });
let user2 = new User({ userId: 2, name: 'Cameron', teamId: 10 });

let expectedSave = `INSERT INTO users (name, team_id) VALUES ('Cameron', 10) ON CONFLICT (user_id) DO UPDATE SET name = 'Cameron', team_id = 10 RETURNING users.user_id, users.name, users.team_id, users.created_at`;
let expectedUpdate = `INSERT INTO users (user_id, name, team_id) VALUES (2, 'Cameron', 10) ON CONFLICT (user_id) DO UPDATE SET name = 'Cameron', team_id = 10 RETURNING users.user_id, users.name, users.team_id, users.created_at`;

assert(user._saveSql() === expectedSave, `Create query is wrong:
	${user._saveSql()}
	${expectedSave}
`);
assert(user2._saveSql() === expectedUpdate, `Update query 1 is wrong:
	${user2._saveSql()}
	${expectedUpdate}
`);

let expectedUpdate2 = `UPDATE users SET name = 'John' WHERE (user_id = 2) RETURNING users.user_id, users.team_id, users.name, users.created_at`

assert(user2._updateSql({ name: 'John' }) === expectedUpdate2, `Update query is wrong:
	${user2._updateSql({ name: 'John' })}
	${expectedUpdate2}
`);

let expectedFetch = `SELECT users.user_id, users.team_id, users.name, users.created_at FROM users WHERE (user_id = 2)`;
assert(user2._fetchSql() === expectedFetch, `Fetch SQL was wrong:
	${user2._fetchSql()}
	${expectedFetch}
`);

let expectedClone1Sql = `INSERT INTO users (name, team_id, user_id, created_at) VALUES ('Cameron', 10, DEFAULT, DEFAULT) RETURNING users.user_id, users.name, users.team_id, users.created_at`;
let expectedClone2Sql = `INSERT INTO users (name, team_id, user_id) VALUES ('Cameron', 10, DEFAULT) RETURNING users.user_id, users.name, users.team_id, users.created_at`;

let cloneSql1 = user._cloneSql({ userId: '__DEFAULT', createdAt: '__DEFAULT' });
let cloneSql2 = user._cloneSql();

assert(cloneSql1 === expectedClone1Sql, `Clone SQL is wrong: ${cloneSql1}`);
assert(cloneSql2 === expectedClone2Sql, `Clone SQL (no argument) is wrong: ${cloneSql2}`);

assert.deepEqual(user.toJSON(), { name: 'Cameron', teamId: 10 });
assert.deepEqual(user2.toJSON(), { userId: 2, name: 'Cameron', teamId: 10 });

user.__context = { admin: true };

assert.deepEqual(user.toJSON(), { name: 'Cameron', teamId: 10, __context: { admin: true } });

console.log('\tModel tests passed');
