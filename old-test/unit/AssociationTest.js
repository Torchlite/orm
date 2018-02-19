let assert = require('assert');

let {
	User,
	Team,
	Game,
	Table
} = require('../bootstrap');

class Owner extends User {}
Team.hasMany(User, {
	key: 'teamId',
	references: 'teamId'
}, 'users');

User.belongsTo(Team, {
	key: 'teamId',
	references: 'id'
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
		},
		result: {
			type: 'boolean'
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

assert(t.owner.userId === 5, 't.owner.userId was wrong');

let rSql = t.games._removeSql(new Game({
	gameId: 2
}));

assert(rSql === `DELETE FROM team_games WHERE (team_id = 1 AND game_id = 2)`, `Remove SQL was wrong: ${rSql}`);

console.log('\tAssociation tests passed');
