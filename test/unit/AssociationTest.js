let { User, Team, Game } = require('../bootstrap');

async function main() {
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
	}, 'owner')

	let t = new Team({ teamId: 1 });
	let user = new User({
		userId: 1,
		teamId: 10
	})

	let collection = t.related(User)
		.filter({
			name: 'John'
		});

	let owner = await user
		.related(Team).fetch()
		.then(t => t.related(Owner).fetch());

	console.log(owner);
}

main();
