'use strict';
let assert = require('assert');
let { Pool } = require('pg');
let pool = new Pool({
	connectionString: 'postgres://localhost:5432/testerino'
});

let BaseCollection = require('../lib/classes/BaseCollection')(pool);
let Table = require('../lib/classes/Table');

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
	constructor(filter, joins) {
		super(filter, joins);
	}

	static get baseTable() {
		return new Table('users', {
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
		});
	}

	static get associatedClass() {
		return User;
	}
}

class Team {
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

class TeamCollection extends BaseCollection {
	constructor(filter) {
		super(filter);
	}

	static get baseTable() {
		return new Table('teams', {
			team_id: {
				type: 'integer',
				isPrimaryKey: true
			},
			name: {
				type: 'string'
			}
		});
	}

	static get associatedClass() {
		return Team;
	}
}

class GameCollection extends BaseCollection {
	constructor(filter) {
		super(filter);
	}

	static get baseTable() {
		return new Table('games', {
			game_id: {
				type: 'integer',
				isPrimaryKey: true
			},
			team_id: {
				type: 'integer',
				isPrimaryKey: true
			},
			date: {
				type: 'date'
			}
		});
	}

	static get associatedClass() {
		// who cares
		return Team;
	}
}

let users = new UserCollection();
let camerons = users.filter({ name: 'Cameron' });

let teams = new TeamCollection()
	.filter({ name: 'Buttkickers' });

let games = new GameCollection()
	.filter({
		date: {
			$gt: '2017-01-01'
		}
	});


let joined = camerons
	.join(teams, { fk: 'users.team_id', references: 'teams.team_id' })
	.join(games, { fk: 'games.team_id', references: 'teams.team_id' });

assert(users.toSql() === 'SELECT users.user_id, users.team_id, users.name FROM users', 'Simple unfiltered returned ' + users.toSql());
assert(camerons.toSql() === `SELECT users.user_id, users.team_id, users.name FROM users WHERE (users.name = 'Cameron')`, 'Simple filter returned ' + camerons.toSql());
assert(joined.toSql() === `SELECT users.user_id, users.team_id, users.name FROM users INNER JOIN teams ON (users.team_id = teams.team_id) INNER JOIN games ON (games.team_id = teams.team_id) WHERE (users.name = 'Cameron' AND teams.name = 'Buttkickers' AND games.date > 2017-01-01)`, 'Joined returned ' + joined.toSql());

require('./filter');

console.log('All tests pass');
