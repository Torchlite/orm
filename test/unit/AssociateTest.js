'use strict';
let assert = require('assert');
let {
	Associate,
	User,
	Team,
	Game,
	Table
} = require('../bootstrap');
let Filter = require('../../lib/Filter');

Associate.impl(User, [Team], {
	associationType: function () {
		return 'manyToOne';
	},
	foreignKey: function () {
		return {
			col: 'team_id',
			val: 'teamId'
		};
	}
});

Associate.impl(Team, [User], {
	associationType: function () {
		return 'oneToMany';
	},
	foreignKey: function () {
		return {
			col: 'team_id',
			val: 'teamId'
		};
	}
});

Associate.impl(Team, [Game], {
	associationType: function () {
		return 'manyToMany';
	},

	foreignKey: function () {
		return {
			col: 'team_id',
			val: 'teamId'
		};
	},
	otherKey: function () {
		return {
			col: 'game_id',
			val: 'gameId'
		};
	},
	joinTable: function () {
		return new Table('game_teams', {
			game_id: {
				type: 'integer'
			},
			team_id: {
				type: 'integer'
			}
		});
	}
});

let t = new Team({ teamId: 1, name: 'Crushinators' });
let u = new User({ id: 1, name: 'John', teamId: 10 });

assert(u._getSql(Team) === 'SELECT teams.team_id, teams.name FROM teams WHERE (team_id = 10)', 'manyToOne get failed');
assert(t._getSql(User) === 'SELECT users.user_id, users.name, users.team_id, users.created_at FROM users WHERE (team_id = 1)', 'oneToMany get failed: ' + t._getSql(User));
assert(t._getSql(Game) === 'SELECT games.game_id, games.date FROM games INNER JOIN game_teams ON (games.game_id = game_teams.game_id) WHERE (team_id=1)', `manyToMany get failed: ${t._getSql(Game)}`);

let f = new Filter({ name: 'a name' });

assert(u._getSql(Team, f) === `SELECT teams.team_id, teams.name FROM teams WHERE (team_id = 10) AND (name = 'a name')`, u._getSql(Team, f));
assert(t._getSql(User, f) === `SELECT users.user_id, users.name, users.team_id, users.created_at FROM users WHERE (team_id = 1) AND (name = 'a name')`, t._getSql(User, f));
assert(t._getSql(Game, f) === `SELECT games.game_id, games.date FROM games INNER JOIN game_teams ON (games.game_id = game_teams.game_id) WHERE (team_id=1) AND (name = 'a name')`, t._getSql(Game, f));

assert(u._addSql(new Team({ teamId: 3 })) === 'UPDATE users SET team_id = 3 WHERE (user_id = 1)', `manyToOne add failed: ${u._addSql(new Team({ teamId: 3 }))}`);
assert(t._addSql(new User({ id: 5 })) === 'UPDATE users SET team_id = 1 WHERE (user_id = 5)', `oneToMany add failed: ${t._addSql(new User({ id: 5 }))}`);
assert(t._addSql(new Game({ gameId: 10 })) === 'INSERT INTO game_teams (team_id, game_id) VALUES (1, 10)', `manyToMany add failed: ${t._addSql(new Game({ gameId: 10 }))}`);
