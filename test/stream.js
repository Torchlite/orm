'use strict';
require('dotenv').config();
let assert = require('assert');

let BaseCollection = require('../lib/BaseCollection');

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

	schema() {
		return {
			user_id: {
				type: 'integer',
				isPrimaryKey: true
			},
			first_name: {
				type: 'string'
			}
		}
	}

	tableName() {
		return 'users';
	}

	get associatedClass() {
		return User;
	}
}

let users = new UserCollection()
	.filter({
		name: 'Cameron'
	});

users.on('create', newUser => newUser.greet());
