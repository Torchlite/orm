'use strict';
let Associate = require('../../lib/Associate')();
let assert = require('assert');
let {
	User,
	UserCollection,
	Team,
	TeamCollection,
	GameCollection,
	Game
} = require('./bootstrap');

Associate.impl(User, [Team], {
	associationType: function() {
		return 'oneToMany'
	},
	foreignKey: function() {
		return {
			col: 'team_id',
			val: 'teamId'
		};
	}
});

Associate.impl(Team, [User], {
	associationType: function() {
		return 'manyToOne'
	},
	foreignKey: function() {
		return {
			col: 'team_id',
			val: 'teamId'
		};
	}
});

Associate.impl(Team, [Game], {
	associationType: function() {
		return 'manyToMany';
	},

	foreignKey: function() {
		return {
			col: 'team_id',
			val: 'teamId'
		}
	},
	otherKey: function() {
		return {
			col: 'game_id',
			val: 'game_id'
		}
	},
	joinTable: function() {
		return 'game_teams'
	}
});

let g = new Game(1, '2017-08-15');
let t = new Team(1, 'Crushinators');
let u = new User(1, 'John', 10);

assert(u.genSql(Team) === 'SELECT teams.team_id, teams.name FROM teams WHERE (team_id = 10)', 'oneToMany failed');
assert(t.genSql(User) === 'SELECT users.user_id, users.name FROM users WHERE (team_id = 1)', 'manyToOne failed');
assert(t.genSql(Game) === 'SELECT games.game_id, games.date FROM games INNER JOIN game_teams ON (games.game_id = game_teams.game_id) WHERE (team_id=1)', 'manyToMany failed');
