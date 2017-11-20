let Traits = require('protoduck');
let squel = require('squel').useFlavour('postgres');
let BaseCollection = require('../BaseCollection');
let BaseModel = require('../BaseModel');

let ManyToMany = Traits.define(['otherModel'], {
	foreignKey: ['otherModel'],
	otherKey: ['otherModel'],
	joinTable: ['otherModel'],

	fetch: [function(otherModel) {
		let otherTable = otherModel.associatedCollection.tableName;
		let otherInstance = new otherModel();

		let jt = this.joinTable(otherInstance);
		let fk = this.foreignKey(otherInstance);
		let ok = this.otherKey(otherInstance);

		console.log(fk);

		let q = squel.select()
			.from(otherTable)
				.join(jt, null, `${otherTable}.${ok} = ${jt}.${ok}`)
			.where(`${fk}=${this[fk]}`);

		return q.toString();
	}]
});

//Test
class User {
	constructor(id, name) {
		this.id = id;
		this.name = name;
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

class Team extends BaseModel {
	constructor(id, name) {
		super();
		this.team_id = id;
		this.name = name;
	}

	cheer() {
		console.log(`Go ${this.name}!`);
	}

	get associatedCollection() {
		return TeamCollection;
	}

	static fromSQLRow(row) {
		return new Team(row.team_id, row.name);
	}
}

class TeamCollection extends BaseCollection {
	constructor(filter) {
		super(filter);
	}

	static get schema() {
		return {
			team_id: {
				type: 'integer',
				isPrimaryKey: true
			},
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

ManyToMany.impl(Team, [User], {
	foreignKey: function() { return 'team_id' },
	otherKey: function() { return 'user_id' },
	joinTable: function() { return 'user_teams' }
});

console.log(new Team(1, 'Crushinators').fetch(User));
