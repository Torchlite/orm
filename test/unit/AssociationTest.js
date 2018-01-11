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

assert(t.owner.userId === 5, 't.owner.userId was wrong');

t.users
	.add(new User({
		name: 'Brantleigh'
	}))
	.then(() => t.users.collect());

let testAdded;
t.games.add(new Game({
	date: '2018-01-01'
}))
	.then(added => {
		testAdded = added;
		return t.games.collect()
	})
	.then(games => assert(games.some(g => g.gameId === testAdded.gameId, 'game was not added')))
	.then(() => console.log('\tbelongsToMany add succeeded'))
	.catch(console.log);

let rSql = t.games._removeSql(new Game({
	gameId: 2
}));

assert(rSql === `DELETE FROM team_games WHERE (team_id = 1 AND game_id = 2)`, `Remove SQL was wrong: ${rSql}`);

console.log('\tAssociation tests passed');
