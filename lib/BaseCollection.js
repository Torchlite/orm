let EventEmitter = require('events');
let squel = require('squel');
let assert = require('assert');
let Filter = require('./Filter');

let sql = squel.useFlavour('postgres');

function generate(connectionPool) {
	/**
	* A `Collection` represents many instances of a model which can be filtered, etc
	* @constructor
	* @param {Filter} filterObject - an instance of the Filter class which to apply to the collection
	*/
	class BaseCollection {
		constructor(filterObject) {
			this.filterObject = filterObject ? filterObject : new Filter();
		}

	/**
	* Filter the collection. The filter object passed in will be turned into an instance of Filter and merged with the existing filters
	* @param {Object} filterObject - an object conforming to the Filter DSL
	*/
		filter(filterObj={}) {
			let newFilter = new Filter(filterObj);

			return new this.constructor(
				this.filterObject.merge(newFilter)
			);
		}

		static dbName() {
			return connectionPool.query(`select current_database()`);
		}

		static get baseTable() {
			throw new Error('You must provide a table for this collection');
		}

		static get associatedClass() {
			throw new Error('You must provide a model for this collection');
		}

		static get fields() {
			return Object.keys(this.baseTable.schema);
		}

	/** Generate SQL to materialize this collection */
		toSql() {
			let query = squel.select();
			query.from(this.constructor.baseTable.tableName);

			query.where(this.filterObject.toSql());

			this.constructor.fields.forEach(f => {
				query.field(f);
			});

			return query.toString();
		}

	/** Reach into the database to materialize the collection into an array of class instances */
		async collect() {
			let associatedClass = this.constructor.associatedClass;
			assert(associatedClass.fromSQLRow, 'associatedClass must implement `fromSQLRow`');

			let result = await connectionPool.query(this.toSql());

			return result.rows.map(r => associatedClass.constructor.fromSQLRow(r));
		}

	/**
	* Reach into the database and return the instance whose id matches the argument
	* @param {integer} id - the id to find in the database
	*/
		async findById(id) {
			let pkey = this.constructor.baseTable.pkey;

			assert(id, 'You must pass an `id` to findById');
			assert(pkey, `Can't findById without a primary key!`);

			let byId = this.filter({
				[pkey]: id
			});

			return byId.collect()
				.then(result => result[0]);
		}
	}

	return BaseCollection;
}

module.exports = generate;
