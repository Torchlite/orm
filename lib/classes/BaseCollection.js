require('dotenv').config();

let EventEmitter = require('events');
let { Client } = require('pg');
let squel = require('squel');
let assert = require('assert');
let Filter = require('./Filter');
let PGPubSub = require('pg-pubsub');

let sql = squel.useFlavour('postgres');

let psInstance = new PGPubSub(process.env.DATABASE_URL);

function generate(connectionPool) {
	class BaseCollection extends EventEmitter {
		constructor(columns, filterObject) {
			super();
			this.filterObject = filterObject || new Filter();
			this.joins = [];

			psInstance.addChannel(this.constructor.tableName, msg => {
				switch(msg.op) {
					case 'INSERT':
						if (this.filterObject.toJsFilter()(msg.new)) {
							this.emit('create', this.constructor.associatedClass.fromSQLRow(msg.new));
						}
						break;
					case 'UPDATE':
						if (
							this.filterObject.toJsFilter()(msg.new) ||
							this.filterObject.toJsFilter()(msg.old) 
						) {
							this.emit('update', {
								new: msg.new,
								old: msg.old
							});
						}
						break;
					case 'DELETE':
						if (this.filterObject.toJsFilter()(msg.old)) {
							this.emit('delete', { old: msg.old });
						}
						break;
				}
			});
		}

		static get pkey() {
			let foo = Object.keys(this.schema).find(k => this.schema[k].isPrimaryKey);
			return foo;
		}

		static select() {
			return sql.select()
				.from(this.tableName);
		}

		static insert() {
			return sql.insert()
				.into(this.tableName);
		}

		static update() {
			return sql.update()
				.table(this.tableName);
		}

		static get schema() {
			throw new Error('You must define the schema');
		}

		static get fields() {
			return Object.keys(this.schema);
		}

		static get tableName() {
			throw new Error('You must let me know the table name');
		}

		static get associatedClass() {
			throw new Error('You must define the associated class');
		}

		filter(filterObj={}) {
			let newFilter = new Filter(filterObj);

			return new this.constructor(
				this.filterObject.merge(newFilter)
			);
		}

		toSql() {
			let schema = this.constructor.schema;
			let tableName = this.constructor.tableName;

			let query = sql.select()
				.from(tableName);

			this.filterObject.applyToSql(query);

			Object.keys(schema).forEach(k => {
				query.field(k);
			});

			return query.toString();
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
