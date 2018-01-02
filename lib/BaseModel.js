let assert = require('assert');

let squel = require('squel').useFlavour('postgres');
let moment = require('moment');
let Association = require('./Association');
let BaseCollection = require('./BaseCollection')();

function generate(pool) {
  /**
  * A `Model` essentially represents a row in the database, but in JS land.
  * Models are returned by `Collection`s, and can be persisted back to the database
  */
	class BaseModel {
		constructor(obj) {
			if (typeof obj === 'undefined') {
				return;
			}

			assert(typeof obj === 'object', 'Argument to BaseModel constructor must be an object');

			Object.keys(obj).forEach(k => {
				if (this.constructor._inverseFieldMap[k]) {
					this[this.constructor._inverseFieldMap[k]] = obj[k];
				} else {
					this[k] = obj[k];
				}
			});
		}

		static hasMany(otherModel, key, alias) {
			if (!this.associations) {
				this.associations = [];
			}

			this.associations.push(new Association(this, otherModel, 'oneToMany', key));
		}

		static hasOne(otherModel, key, alias) {
			if (!this.associations) {
				this.associations = [];
			}

			this.associations.push(new Association(this, otherModel, 'manyToOne', key));
		}

		related(otherModel) {
			let assoc = this.constructor
				.associations
				.find(a => a._rModel === otherModel);

			switch(assoc._type) {
				case 'oneToMany':
					let coll = new (BaseCollection.of(otherModel))()
						.filter({
							[assoc._key.references]: this[assoc._key.key]
						});

					return coll;
				case 'manyToOne':
					return new otherModel({
						[assoc._key.references]: this[assoc._key.key]
					});
			}
		}

		static get table() {
			throw new Error('A model must be backed by a table, but this one is not');
		}

		static fromId(id) {
			let key = this._inverseFieldMap[this.table.pkey];

			return new this({
				[key]: id
			});
		}

		/**
		* Convert a row from `pg` into an instance of this model
		* @param {Object} row - a row from `pg`
		*/
		static fromSQLRow(row) {
			let obj = {};

			Object.keys(row).forEach(k => {
				if (this._inverseFieldMap[k] && this.table.schema[k]) {
					switch (this.table.schema[k].type) {
						// Numeric types:
						case 'bigint':
						case 'int':
						case 'smallint':
							obj[k] = parseInt(row[k], 10);
							break;

						// Date/Time types:
						case 'timestamp without time zone':
						case 'timestamp with time zone':
						case 'date':
							obj[k] = moment(row[k]);
							break;

						// Interval:
						case 'interval':
							obj[k] = moment.duration(row[k]).toISOString();
							break;
						default:
							obj[k] = row[k];
							break;
					}
				}
			});

			let result = new this(obj);

			let ctxKeys = Object.keys(row).filter(r => r.substring(0, 10) === '__context_');

			if (ctxKeys.length > 0) {
				let ctxObject = {};

				ctxKeys.forEach(k => {
					let newKey = k.substring(10);

					ctxObject[newKey] = row[k];
				});

				result.__context = ctxObject;
			}

			return result;
		}

		/**
		* An object which holds mappings from the fields of this model (keys) to columns of the database (values)
		*/
		static get fieldMap() {
			throw new Error('Must implement `fieldMap`');
		}

		static get _inverseFieldMap() {
			let map = {};

			Object.keys(this.fieldMap).forEach(k => {
				map[this.fieldMap[k]] = k;
			});

			return map;
		}

		_id() {
			let dbkey = this.constructor.table.pkey;
			let fm = this.constructor.fieldMap;
			let key = Object.keys(fm).find(x => fm[x] === dbkey);

			return this[key];
		}

		/**
		* Generate SQL for updating this instance in the databse
		*/
		_updateSql(obj) {
			let table = this.constructor.table;
			let fm = this.constructor.fieldMap;
			let ifm = this.constructor._inverseFieldMap;

			let q = squel.update()
				.table(table.tableName);

			Object.keys(obj).forEach(k => {
				q.set(fm[k], obj[k]);
			});

			Object.keys(fm).forEach(k => {
				q.returning(fm[k]);
			});

			q.where(`${table.pkey} = ?`, this[ifm[table.pkey]]);

			return q.toString();
		}

		/**
		* Generate SQL for saving an instance of this model to the database
    * Note that it will always generate a postgres `upsert` query
		*/
		_saveSql() {
			let table = this.constructor.table;
			let fm = this.constructor.fieldMap;

			let q = squel.insert()
				.into(table.tableName);

			let conflictObject = {};

			Object.keys(fm).forEach(k => {
				q.returning(fm[k]);

				if (this[k] === undefined) {
					return;
				}

				if (this[k] === null && this.constructor.table.schema[fm[k]].isPrimaryKey) {
					return q.set(fm[k], 'DEFAULT', { dontQuote: true });
				}

				if (fm[k] !== table.pkey) {
					conflictObject[fm[k]] = this[k];
				}

				q.set(fm[k], this[k]);
			});

			q.onConflict(table.pkey, conflictObject);

			return q.toString();
		}

		_fetchSql() {
			assert(this._id(), `Cannot fetch without the ID`);

			let table = this.constructor.table;
			let fm = this.constructor.fieldMap;

			let q = squel.select()
				.from(table.tableName)
				.where(`${table.pkey} = ?`, this._id());

			Object.keys(fm).forEach(k => {
				q.field(`${table.tableName}.${fm[k]}`);
			});

			return q.toString();
		}

		async fetch() {
			return pool.query(this._fetchSql())
				.then(r => this.constructor.fromSQLRow(r.rows[0]));
		}

		/**
		* Perform the upsert described by `saveSql`
		*/
		async save() {
				return pool.query(this._saveSql())
					.then(r => new this.constructor(r.rows[0]));
		}

		/**
		* Perform the update described by `updateSql`
		*/
		async update(obj) {
			return pool.query(this._updateSql(obj))
				.then(r => new this.constructor(r.rows[0]));
		}
	}

	return BaseModel;
}

module.exports = generate;
