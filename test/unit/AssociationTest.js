let assert = require('assert');

let { User, Team } = require('../bootstrap');

class Owner extends User {}
// Basic oneToMany
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

assert(collection.toSql() === 'SELECT user_id, name, team_id, created_at FROM users WHERE (team_id = 1 AND name = \'John\')');

assert(typeof userTeam.cheer === 'function');
assert(typeof userTeam.teamId === 'number', `Team id type: ${typeof userTeam.teamId}`);
assert(userTeam.teamId === 10, `Team id: ${userTeam.teamId}`);
