let squel = require('squel').useFlavour('postgres');
let assert = require('assert');
let Filter = require('./Filter');
let Mixable = require('./Mixable');
let performQuery = require('./performQuery');

squel.cls.DefaultQueryBuilderOptions.replaceSingleQuotes = true;
squel.cls.DefaultQueryBuilderOptions.singleQuoteReplacement = '\'\'';

/**
* A `Collection` represents many instances of a model which can be filtered, etc
* @constructor
* @param {Filter} filterObject - an instance of the Filter class which to apply to the collection
*/
class BaseCollection extends Mixable {
	constructor(filterObject, limit, offset, order) {
		super();

		this.filterObject = filterObject ? filterObject : new this.constructor.filterClass();
		this._limit = limit || null;
		this._offset = offset || null;
		this._order = order || null;
	}

/**
* If the table backing this collection is configured appropriately (see `track_changes.sql`),
* this method will return an EventEmitter which sends `add`, `remove`, and `update` events
* for items that belong in your Collection
**/
	listen() {
		let tab = this.constructor.associatedClass.table;

		tab.on('UPDATE', msg => {
			assert(msg.new, 'Something has gone wrong -- UPDATE message did not have `new`');
			assert(msg.old, 'Something has gone wrong -- UPDATE message did not have `old`');

			this.emit('update', this.constructor.associatedClass.fromSQLRow(msg.new), this.constructor.associatedClass.fromSQLRow(msg.old));
		});

		tab.on('DELETE', msg => {
			let mappedOld = this.constructor.associatedClass._inverseMapFields(msg.old);

			if (this.filterObject.toJsFilter()(mappedOld)) {
				this.emit('remove', this.constructor.associatedClass.fromSQLRow(msg.old));
			}
		});

		tab.on('INSERT', msg => {
			let mappedNew = this.constructor.associatedClass._inverseMapFields(msg.new);

			if (this.filterObject.toJsFilter()(mappedNew)) {
				this.emit('add', this.constructor.associatedClass.fromSQLRow(msg.new));
			}
		});
	}

	static get filterClass() {
		return Filter;
	}

	static init(connectionPool) {
		this._pool = connectionPool;
	}

	/**
	* Filter the collection. The filter object passed in will be turned into an instance of Filter and merged with the existing filters
	* @param {Object} filterObject - an object conforming to the Filter DSL
	*/
	filter(filterObj = {}) {

		let newFilter = new this.constructor.filterClass(
			filterObj
		);

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

	/**
	* Order your collection
	* @param {string} key - the field to sort by
	* @param {string} direction - 'asc' for an ascending sort, 'desc' for a descending sort
	*/
	sort(key, direction) {
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

	/**
	* Create a BaseCollection of a particular kind of model
	* @param{Model} model - the model of which the Collection is made
	*/
	static of(model) {
		class AnonymousCollection extends this {
			static get associatedClass() {
				return model;
			}
		}

		return AnonymousCollection;
	}

	static dbName() {
		return this._pool.query(`select current_database()`);
	}

	get _baseSelector() {
		let mappedFields = this.constructor.associatedClass.mapFields(this.filterObject.obj, { prepend: true });
		let f = new this.constructor.filterClass(mappedFields);

		let s = squel.select()
			.from(this.constructor.associatedClass.table.tableName)
			.where(f.toSql());

		return s;
	}

	static get associatedClass() {
		throw new Error('You must provide a model for this collection');
	}

	static get fields() {
		return Object.keys(this.associatedClass._inverseFieldMap);
	}

/** Generate SQL to materialize this collection */
	get _collectSql() {
		let query = this._baseSelector;

		this.constructor.fields.forEach(k => {
			query.field(`${this.constructor.associatedClass.table.tableName}.${k}`);
		});

		query.limit(this._limit);
		query.offset(this._offset);

		if (this._order) {
			query.order(`${this.constructor.associatedClass.table.tableName}.${this._order.key}`, this._order.direction.toLowerCase() === 'asc');
		}

		return query;
	}

/** Reach into the database to materialize the collection into an array of class instances */
	async collect() {
		assert(this.constructor.associatedClass, 'A collection must have an associatedClass implementation');
		assert(this.constructor.associatedClass.fromSQLRow, 'associatedClass must implement `fromSQLRow`');

		let associatedClass = this.constructor.associatedClass;

		let result = await performQuery(
			this._collectSql,
			this.constructor._pool
		);

		return result.rows.map(r => associatedClass.fromSQLRow(r));
	}

/** Generate SQL for counting items in the collection **/
	_countSql() {
		let query = this._baseSelector
			.field('count(*)');

		return query;
	}

/** Add a new item to the collection
@param {object} newItem - the data to be added.
*/
	add(newItem) {
		let newInstance = new (this.constructor.associatedClass)(newItem);

		return newInstance.save();
	}

/** Remove an item from a collection. Note: if using a raw collection, just use `delete` in the instance
@param {Instance} item - the instance to remove
*/
	remove(newItem) {
		throw new Error('Not implemented; use `delete` in the instance.');
	}

/** Count the number of items in the collection **/
	async count() {
		let result = await performQuery(this._countSql(), this.constructor._pool);

		return parseInt(result.rows[0].count, 10);
	}

/**
* Reach into the database and return the instance whose id matches the argument
* @param {integer} id - the id to find in the database
*/
	async findById(id) {
		let pkey = this.constructor.associatedClass.table.pkey;

		assert(id, 'You must pass an `id` to findById');
		assert(pkey, `Can't findById without a primary key!`);

		let byId = this
			.filter({
				[pkey]: id
			})
			.offset(0)
			.limit(1);

		return byId.collect()
			.then(result => {
				return result[0]
			});
	}

/**
Find a single instance in the database that belongs to the collection and return it
@param {object} filter - An optional filter to apply to the collection before the fetch
*/
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

module.exports = BaseCollection;
