let { User, Team, Game } = require('../bootstrap');

// Basic oneToMany

Team.hasMany(User, {
	key: 'teamId',
	references: 'teamId'
}, 'users');

User.hasOne(Team, {
	key: 'teamId',
	references: 'teamId'
}, 'team')

let t = new Team({ teamId: 1 });
let user = new User({
	userId: 1,
	teamId: 10
})

let collection = t.related(User)
	.filter({
		name: 'John'
	});

let userT = user.related(Team);

console.log(userT);
console.log(collection.toSql());
