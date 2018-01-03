let assert = require('assert');

let { User, Team, Game, Table } = require('../bootstrap');

class Owner extends User {}
Team.hasMany(User, {
	key: 'teamId',
	references: 'teamId'
}, 'users');

User.hasOne(Team, {
	key: 'teamId',
	references: 'teamId'
}, 'team');

Team.hasOne(Owner, {
	key: 'owner',
	references: 'id'
}, 'owner');

Team.belongsToMany(Game, {
	through: new Table('team_games', {
		game_id: {
			type: 'integer'
		},
		team_id: {
			type: 'integer'
		}
	}),
	leftKey: {
		key: 'teamId',
		references: 'team_id'
	},
	rightKey: {
		key: 'gameId',
		references: 'game_id'
	}
});

let t = new Team({ teamId: 1 });
let user = new User({
	userId: 1,
	teamId: 10
});

let collection = t.related(User)
	.filter({
		name: 'John'
	});

let userTeam = user.related(Team);

assert(collection.toSql() === 'SELECT users.user_id, users.name, users.team_id, users.created_at FROM users WHERE (team_id = 1 AND name = \'John\')', collection.toSql());
assert(typeof userTeam.cheer === 'function');
assert(typeof userTeam.teamId === 'number', `Team id type: ${typeof userTeam.teamId}`);
assert(userTeam.teamId === 10, `Team id: ${userTeam.teamId}`);

console.log(Object.keys(t));
console.log(t.users.toSql());

assert(userTeam.related(Game).toSql() === 'SELECT games.game_id, games.date, team_games.game_id AS __context_game_id, team_games.team_id AS __context_team_id FROM games INNER JOIN team_games ON (games.game_id = team_games.game_id) INNER JOIN teams ON (teams.team_id = team_games.team_id) WHERE (teams.team_id = 10)')
