'use strict';

let BaseCollection = require('../../lib/BaseCollection')();
let BaseModel = require('../../lib/BaseModel')();
let Table = require('../../lib/Table');

let userTable = new Table('users', {
	user_id: {
		type: 'integer',
		isPrimaryKey: true
	},
	team_id: {
		type: 'integer'
	},
	name: {
		type: 'date'
	}
});

class User extends BaseModel {
	greet() {
		console.log(`Hello, ${this.name}`);
	}

	static get fieldMap() {
		return {
			id: 'user_id',
			name: 'name',
			teamId: 'team_id'
		};
	}

	static get table() {
		return userTable;
	}

	static fromSQLRow(row) {
		return new User(row);
	}
}

class UserCollection extends BaseCollection {
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
	cheer() {
		console.log(`Go ${this.name}!`);
	}

	static get table() {
		return teamTable;
	}

	static fromSQLRow(row) {
		return new Team(row.team_id, row.name);
	}

	static get fieldMap() {
		return {
			teamId: 'team_id',
			name: 'name'
		};
	}
}

class TeamCollection extends BaseCollection {
	static get baseTable() {
		return teamTable;
	}

	static get associatedClass() {
		return Team;
	}
}

class GameCollection extends BaseCollection {
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
	constructor(obj) {
		super(obj);
	}

	fromSQLRow(row) {
		return new Game(row);
	}

	static get table() {
		return gameTable;
	}

	static get associatedCollection() {
		return GameCollection;
	}

	static get fieldMap() {
		return {
			gameId: 'game_id',
			date: 'date'
		};
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
