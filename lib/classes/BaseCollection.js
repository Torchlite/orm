require('dotenv').config();

let EventEmitter = require('events');
let { Client } = require('pg');
let squel = require('squel');
let assert = require('assert');
let Filter = require('./Filter');
let PGPubSub = require('pg-pubsub');

let sql = squel.useFlavour('postgres');

let psInstance = new PGPubSub(process.env.DATABASE_URL);


function toQualified(obj, tableName) {
	let newObj = {};

	Object.keys(obj).forEach(k => {
		newObj[`${tableName}.${k}`] = obj[k];
	});

	return newObj;
};

function generate(connectionPool) {
	class BaseCollection {
		constructor(filterObject, joins) {
			this.filterObject = filterObject ? filterObject : new Filter();
			this.joins = joins || [];
		}

		static get baseTable() {
			throw new Error('You must define the table when you inherit from `BaseCollection`');
		}

		static get associatedClass() {
			throw new Error('You must define the associated class');
		}

		filter(filterObj={}) {
			let newFilter = new Filter(toQualified(filterObj, this.constructor.baseTable.tableName));

			return new this.constructor(
				this.filterObject.merge(newFilter)
			);
		}

		toSql() {
			let table = this.constructor.baseTable;
			let schema = table.schema;
			let tableName = table.tableName;

			let query = table.select();

			// Joins:
			/*
			 * {
			 *	 table: <instance of Table>,
			 *	 key: {
			 *		 fk: <someString>,
			 *		 references: <somethingElse>,
			 *	 }
			 * }
			 *
			 */

			query.where(this.filterObject.toSql());

			this.joins.forEach(j => {
				query.join(j.table.tableName, null, `${j.key.fk} = ${j.key.references}`)
			})

			Object.keys(schema).forEach(k => {
				query.field(`${tableName}.${k}`);
			});

			return query.toString();
		}

		join(collection, key) {
			assert(key.references, 'second argument to `join` should be an object with `fk` and `references` properties');
			assert(key.fk, 'second argument to `join` should be an object with `fk` and `references` properties');

			let arr = Array.from(this.joins);
			arr.push({ table: collection.constructor.baseTable, key });

			return new this.constructor(this.filterObject.merge(collection.filterObject), arr);
		}

		async find() {
			let associatedClass = this.associatedClass;
			assert(associatedClass.fromSQLRow, 'associatedClass must implement `fromSQLRow`');

			let result = await connectionPool.query(this.toSql());

			return result.rows.map(r => associatedClass.fromSQLRow(r));
		}

		async findById(id) {
			let schema = this.schema;
			let pkey = this.constructor.pkey;

			assert(id, 'You must pass an `id` to findById');
			assert(pkey, `Can't findById without a primary key!`);

			let byId = this.filter({
				[pkey]: id
			});

			return byId.find()
				.then(r => r[0]);
		}
	}

	return BaseCollection;
}

module.exports = generate;
