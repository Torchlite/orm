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

assert(user.saveSql() === `INSERT INTO users (name, team_id) VALUES ('Cameron', 10) ON CONFLICT (user_id) DO UPDATE SET name = 'Cameron', team_id = 10`, 'Save query is wrong');
