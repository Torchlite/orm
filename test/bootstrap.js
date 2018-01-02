'use strict';

require('dotenv').config();

let assert = require('assert');

let ORM = require('../index');

let {
	Associate,
	BaseCollection,
	BaseModel,
	Table,
	query
} = new ORM({
	dbUrl: process.env.TEST_DB_URL
});

let userTable = new Table('users', {
	user_id: {
		type: 'integer',
		isPrimaryKey: true
	},
	name: {
		type: 'text'
	},
	team_id: {
		type: 'integer'
	},
	created_at: {
		type: 'timestamp with time zone'
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
		};
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

	static get fieldMap() {
		return {
			teamId: 'team_id',
			name: 'name'
		}
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
		return Game;
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

	static get fieldMap() {
		return {
			gameId: 'game_id',
			date: 'date'
		}
	}
}

Associate.impl(User, [Team], {
	associationType: function () {
		return 'manyToOne';
	},
	foreignKey: function () {
		return {
			col: 'team_id',
			val: 'teamId'
		};
	}
});

Associate.impl(Team, [User], {
	associationType: function () {
		return 'oneToMany';
	},
	foreignKey: function () {
		return {
			col: 'team_id',
			val: 'teamId'
		};
	}
});

Associate.impl(Team, [Game], {
	associationType: function () {
		return 'manyToMany';
	},

	foreignKey: function () {
		return {
			col: 'team_id',
			val: 'teamId'
		};
	},
	otherKey: function () {
		return {
			col: 'game_id',
			val: 'gameId'
		};
	},
	joinTable: function () {
		return 'game_teams';
	}
});

module.exports = {
	Associate,
	User,
	UserCollection,
	Team,
	TeamCollection,
	GameCollection,
	Game,
	Table,
	BaseCollection
};
