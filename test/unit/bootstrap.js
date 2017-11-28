'use strict';

let BaseCollection = require('../../lib/BaseCollection')();
let BaseModel = require('../../lib/BaseModel')();
let Table = require('../../lib/Table');

let userTable = new Table('users', {
	user_id: {
		type: 'integer',
		isPrimaryKey: true
	},
	name: {
		type: 'date'
	}
});

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

	static get fieldMap() {
		return {
			id: 'user_id',
			name: 'name',
			teamId: 'team_id'
		}
	}

	static get table() {
		return userTable;
	}

	static fromSQLRow(row) {
		return new User(row.user_id, row.name);
	}
}

class UserCollection extends BaseCollection {
	constructor(filter) {
		super(filter);
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

let teamTable = new Table('teams', {
	team_id: {
		type: 'integer',
		isPrimaryKey: true
	},
	name: {
		type: 'string'
	}
});

class Team extends BaseModel {
	constructor(id, name) {
		super();
		this.teamId = id;
		this.name = name;
	}

	cheer() {
		console.log(`Go ${this.name}!`);
	}

	static get table() {
		return teamTable;
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
		return teamTable;
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

let gameTable = new Table('games', {
	game_id: {
		type: 'integer',
		isPrimaryKey: true
	},
	date: {
		type: 'date'
	}
});

class Game extends BaseModel {
	constructor(id, date) {
		super();
		this.id = id;
		this.date = date;
	}

	fromSQLRow(row) {
		return new Game(row.game_id, moment(row.date));
	}

	static get table() {
		return gameTable;
	}

	static get associatedCollection() {
		return GameCollection;
	}
}

module.exports = {
	User,
	UserCollection,
	Team,
	TeamCollection,
	GameCollection,
	Game
};
