let assert = require('assert');

let {
	User,
	Team,
	Game,
	Table,
	BaseCollection
} = require('../bootstrap');

class Owner extends User {}
Team.hasMany(User, {
	key: 'teamId',
	references: 'teamId'
}, 'users');

User.belongsTo(Team, {
	key: 'teamId',
	references: 'teamId'
}, 'team');

Team.belongsTo(Owner, {
	key: 'ownerId',
	references: 'userId'
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
}, 'games');

let t = new Team({ teamId: 1 });

t.owner = new User({ userId: 5 });
