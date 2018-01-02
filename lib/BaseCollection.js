let squel = require('squel').useFlavour('postgres');
let assert = require('assert');
let Filter = require('./Filter');

function generate(connectionPool) {
	/**
	* A `Collection` represents many instances of a model which can be filtered, etc
	* @constructor
	* @param {Filter} filterObject - an instance of the Filter class which to apply to the collection
	*/
	class BaseCollection {
		constructor(filterObject, limit, offset, order) {
			this.filterObject = filterObject ? filterObject : new Filter();
			this._limit = limit || null;
			this._offset = offset || null;
			this._order = order || null;
		}

		/**
		* Filter the collection. The filter object passed in will be turned into an instance of Filter and merged with the existing filters
		* @param {Object} filterObject - an object conforming to the Filter DSL
		*/
		filter(filterObj = {}) {
			let newFilter = new Filter(filterObj);

			return new this.constructor(
				this.filterObject.merge(newFilter),
				this._limit,
				this._offset,
				this._order
			);
		}

		/**
		* Limit the collection size.
		* @param {integer} n - The desired limit
		*/
		limit(n) {
			assert(typeof n === 'number', 'argument to `limit` must be a number');
			assert(n >= 0, 'argument to `limit` must be positive');
			assert(!isNaN(n), 'argument to `limit` must not be NaN');

			return new this.constructor(
				this.filterObject,
				n,
				this._offset,
				this._order
			);
		}

		/**
		* Add an offset to the collection
		* @param {integer} n - The desired offset
		*/
		offset(n) {
			assert(typeof n === 'number', 'argument to `offset` must be a number');
			assert(n >= 0, 'argument to `offset` must be positive');
			assert(!isNaN(n), 'argument to `offset` must not be NaN');

			return new this.constructor(
				this.filterObject,
				this._limit,
				n,
				this._order
			);
		}

		order(key, direction) {
			assert(typeof key === 'string', '`key` must be a string');
			assert(direction.toLowerCase() === 'asc' || direction.toLowerCase() === 'desc', '`direction` must be either `asc` or `desc`');

			let order = {
				key: this.constructor.associatedClass.fieldMap[key] || key,
				direction
			};

			return new this.constructor(
				this.filterObject,
				this._limit,
				this._offset,
				order
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

			query.limit(this._limit);
			query.offset(this._offset);

			if (this._order) {
				query.order(this._order.key, this._order.direction.toLowerCase() === 'asc');
			}

			return query.toString();
		}

	/** Reach into the database to materialize the collection into an array of class instances */
		async collect() {
			assert(this.constructor.associatedClass, 'A collection must have an associatedClass implementation');
			assert(this.constructor.associatedClass.fromSQLRow, 'associatedClass must implement `fromSQLRow`');

			let associatedClass = this.constructor.associatedClass;

			let result = await connectionPool.query(this.toSql());

			return result.rows.map(r => associatedClass.fromSQLRow(r));
		}

	/** Generate SQL for counting items in the collection **/
		_countSql() {
			let query = squel.select()
				.field('count(*)')
				.from(this.constructor.baseTable.tableName)
				.where(this.filterObject.toSql());

			return query.toString();
		}

	/** Count the number of items in the collection **/
		async count() {
			let result = await connectionPool.query(this._countSql());

			return parseInt(result.rows[0].count, 10);
		}

	/**
	* Reach into the database and return the instance whose id matches the argument
	* @param {integer} id - the id to find in the database
	*/
		async findById(id) {
			let pkey = this.constructor.baseTable.pkey;

			assert(id, 'You must pass an `id` to findById');
			assert(pkey, `Can't findById without a primary key!`);

			let byId = this
				.filter({
					[pkey]: id
				})
				.limit(1);

			return byId.collect()
				.then(result => result[0]);
		}

		async findOne(filter) {
			assert(typeof filter === 'object' || typeof filter === 'undefined', 'argument to findOne must be a filter object');

			let collection = this
				.limit(1);

			if (filter) {
				collection = collection
					.filter(filter);
			}

			return collection
				.collect()
				.then(result => result[0]);
		}
	}

	return BaseCollection;
}

module.exports = generate;
