require('dotenv').config();

let EventEmitter = require('events');
let squel = require('squel');
let assert = require('assert');
let Filter = require('./Filter');
let PGPubSub = require('pg-pubsub');

let sql = squel.useFlavour('postgres');

let psInstance = new PGPubSub(process.env.DATABASE_URL);

function generate(connectionPool) {
	class BaseCollection {
		constructor(filterObject) {
			this.filterObject = filterObject ? filterObject : new Filter();
		}

		filter(filterObj={}) {
			let newFilter = new Filter(filterObj);

			return new this.constructor(
				this.filterObject.merge(newFilter)
			);
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

		toSql() {
			let query = squel.select();
			query.from(this.constructor.baseTable.tableName);

			query.where(this.filterObject.toSql());

			this.constructor.fields.forEach(f => {
				query.field(f);
			});

			return query.toString();
		}

		join(collection, key) {
			console.warn(`Please don't BaseCollection#join yet`);
			assert(key.references, 'second argument to `join` should be an object with `fk` and `references` properties');
			assert(key.fk, 'second argument to `join` should be an object with `fk` and `references` properties');

			let arr = Array.from(this.joins);
			arr.push({ table: collection.constructor.baseTable, key });

			return new this.constructor(this.filterObject.merge(collection.filterObject), arr);
		}

		async collect() {
			let associatedClass = this.constructor.associatedClass;
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

			return byId;
		}
	}

	return BaseCollection;
}

module.exports = generate;
