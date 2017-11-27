let assert = require('assert');
let { Pool } = require('pg');
let pool = new Pool({
	connectionString: 'postgres://localhost:5432/testerino'
});
let BaseCollection = require('../lib/classes/BaseCollection')(pool);
let BaseModel = require('../lib/classes/BaseModel');
let Table = require('../lib/classes/Table');
let OneToMany = require('../lib/associations/OneToMany');
let ManyToOne = require('../lib/associations/ManyToOne');
let ManyToMany = require('../lib/associations/ManyToMany')();

class User extends BaseModel {
	constructor(id, name, teamId) {
		super();
		this.id = id;
		this.name = name;
		this.teamId = teamId;
	}

	greet() {
		console.log(`Hello, ${this.name}`);
	}

	static get associatedCollection() {
		return UserCollection;
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

class Team extends BaseModel {
	constructor(id, name) {
		super();
		this.id = id;
		this.name = name;
	}

	static get associatedCollection() {
		return TeamCollection;
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

class Game extends BaseModel {
	constructor(id, date) {
		super();
		this.id = id;
		this.date = date;
	}

	static get associatedCollection() {
		return GameCollection;
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
			date: {
				type: 'date'
			}
		});
	}

	static get associatedClass() {
		return Game;
	}
}

ManyToOne.impl(User, [Team], {
	foreignKey: function() {
		return {
			col: 'team_id',
			val: 'teamId'
		}
	}
});
/*OneToMany.impl(Team, [User], {
	foreignKey: function() {
		return {
			col: 'team_id',
			val: 'id'
		}
	}
});*/
ManyToMany.impl(Team, [Game], {
	foreignKey: function() {
		return {
			col: 'team_id',
			val: 'id'
		}
	},

	otherKey: function() {
		return {
			col: 'game_id'
		}
	},

	joinTable: function() {
		return 'team_games';
	}
});

let t =  new Team(2, 'Crushinators');
let u = new User(1, 'John', 20);

//assert(t.get(User).toSql() === 'SELECT users.user_id, users.team_id, users.name FROM users WHERE (users.team_id = 2)', 'ManyToOne failed');
assert(u.get(Team).toSql() === 'SELECT teams.team_id, teams.name FROM teams WHERE (teams.team_id = 20)', 'OneToMany failed; generated: ' + u.get(Team).toSql());
console.log(t.get(Game).toSql());
