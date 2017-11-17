'use strict';
let assert = require('assert');

let BaseCollection = require('../lib/BaseCollection');

let ManyToOne = require('../lib/associations/ManyToOne');
let OneToMany = require('../lib/associations/OneToMany');

class User {
	constructor(id, name) {
		this.id = id;
		this.name = name;
	}

	greet() {
		console.log(`Hello, ${this.name}`);
	}

	static fromSQLRow(row) {
		return new User(row.user_id, row.name);
	}
}

class UserCollection extends BaseCollection {
	constructor(filter) {
		super(filter);
	}

	static get schema() {
		return {
			user_id: {
				type: 'integer',
				isPrimaryKey: true
			},
			team_id: {
				type: 'integer'
			},
			name: {
				type: 'string'
			}
		}
	}

	static get tableName() {
		return 'users'
	}

	static get associatedClass() {
		return User;
	}
}

class Team extends BaseCollection {
	constructor(id, name) {
		this.id = id;
		this.name = name;
	}

	cheer() {
		console.log(`Go ${this.name}!`);
	}

	static fromSQLRow(row) {
		return new Team(row.team_id, row.name);
	}
}

/*class TeamCollection extends BaseCollection {
	constructor(filter) {
		super(filter);
	}

	static get schema() {
		return {
			team_id: {
				type: 'integer',
				isPrimaryKey: true
			}
			name: {
				type: 'string'
			}
		}
	}

	static get tableName() {
		return 'teams'
	}

	static get associatedClass() {
		return Team;
	}
}
*/
let users = new UserCollection();
let camerons = new UserCollection().filter({ name: 'Cameron' });

console.log(camerons.toSql());

camerons.on('create', u => u.greet());

/*OneToMany.impl(Team, [User], {
	
})

ManyToOne.impl(User, [Team], {
	
})*/
