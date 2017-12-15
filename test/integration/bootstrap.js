'use strict';
let ORM = require('../../index');

let {
	BaseCollection,
	BaseModel,
	Table
} = new ORM({
	dbUrl: 'postgres://localhost:5432/testerino'
});

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
	greet() {
		return `Hello, ${this.name}`;
	}

	static get table() {
		return userTable;
	}

	static get fieldMap() {
		return {
			id: 'user_id',
			teamId: 'team_id',
			name: 'name'
		}
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
	cheer() {
		console.log(`Go ${this.name}!`);
	}

	static get table() {
		return teamTable;
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
