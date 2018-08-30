let assert = require('assert');
let Mixable = require('./Mixable');

let squel = require('squel').useFlavour('postgres');
let moment = require('moment');
let Association = require('./Association');
let BaseCollection = require('./BaseCollection');
let Filter = require('./Filter');
let performQuery = require('./performQuery');

squel.cls.DefaultQueryBuilderOptions.replaceSingleQuotes = true;
squel.cls.DefaultQueryBuilderOptions.singleQuoteReplacement = '\'\'';

/**
* A `Model` essentially represents a row in the database, but in JS land.
* Models are returned by `Collection`s, and can be persisted back to the database
*/
class BaseModel extends Mixable {
	constructor(obj) {
		super();
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

/**
* If the table backing this Model is configured appropriately (see `track_changes.sql`),
* this method will return an EventEmitter which sends `update` and `delete` events for
* this instance
*/
	listen() {
		let tab = this.constructor.table;

		tab.on('UPDATE', msg => {
			if (msg.new[tab.pkey] === this._id()) {
				this.emit('update', this.constructor.fromSQLRow(msg.new), this.constructor.fromSQLRow(msg.old));
			}
		});

		tab.on('DELETE', msg => {
			if (msg.old[tab.pkey] === this._id()) {
				this.emit('delete', this.constructor.fromSQLRow(msg.old));
			}
		});
	}

	static init(pool) {
		this._pool = pool;
	}

/**
* Define a one-to-many relationship with another Model
* @param {Model} otherModel - the other model
* @param {object} key - foreign key information. The object should have a `key` and a `references` field, where `key` is the field on this model and `references` is the field on the other model
* @param {string} alias - what to call the related instances on this Model
*/
	static hasMany(otherModel, key, alias) {
		assert(alias, '`alias` argument is required');
		assert(otherModel, '`otherModel` argument is required');
		assert(key, '`key` argument is required');

		if (!this.associations) {
			this.associations = [];
		}

		let assoc = new Association(this, otherModel, 'oneToMany', key, alias);
		let pool = this._pool;

		Object.defineProperty(this.prototype, alias, {
			get: function () {
				let fm = this.constructor.fieldMap;
				let otherFm = otherModel.fieldMap;
				let assoc = this.constructor
					.associations
					.find(a => a._rModel === otherModel);

				let id = this[assoc._key.references];

				class HasManyCollection extends BaseCollection.of(otherModel) {
					get _baseSelector() {
						let s = super._baseSelector;
						let f = new Filter({
							[otherFm[assoc._key.key]]: id
						});

						return s.where(f.toSql());
					}

					get association() {
						return assoc;
					}

					add(newItem) {
						newItem[fm[assoc._key.key]] = id;

						return new otherModel(newItem)
							.save();
					}

					remove(item) {
						if (item[fm[assoc._key.key]] === id) {
							item[fm[assoc._key.key]] = null;

							return item.save();
						}

						return Promise.reject('Provided instance was not in the collection');
					}
				}

				HasManyCollection.init(pool);

				return new HasManyCollection();
			},
			enumerable: true
		});

		this.associations.push(assoc);
	}


/**
* Define a many-to-one relationship with another Model
* @param {Model} otherModel - the other model
* @param {object} key - foreign key information. The object should have a `key` and a `references` field, where `key` is the field on this model and `references` is the field on the other model
* @param {string} alias - what to call the related instances on this Model
*/
	static belongsTo(otherModel, key, alias) {
		assert(alias, '`alias` argument is required');
		assert(otherModel, '`otherModel` argument is required');
		assert(key, '`key` argument is required');
		assert(alias !== key.key, 'Key cannot be the same as the alias');

		if (!this.associations) {
			this.associations = [];
		}

		let assoc = new Association(this, otherModel, 'manyToOne', key, alias);

		let cached = null;

		Object.defineProperty(this.prototype, alias, {
			get: function () {
				let id = this[key.key];

				if (!id) {
					return null;
				}

				return cached || new otherModel({
					[assoc._key.references]: id
				});
			},

			set: function (newValue) {
				if (typeof newValue.then === 'function') {
					return newValue
						.then(result => {
							let toCache = {};
							this[key.key] = result[assoc._key.references];

							Object.keys(result).forEach(k => {
								toCache[k] = result[k];
							});

							cached = new otherModel(toCache);
						});
				}

				assert(newValue[assoc._key.references], `Must provide at least ${assoc._key.references}, but got ${Object.keys(newValue).join(', ')}`);

				this[key.key] = newValue[assoc._key.references];
			}
		});

		this.associations.push(assoc);
	}

/**
* Define a many-to-many relationship with another Model
* @param {Model} otherModel - the other model
* @param {object} key - foreign key information. Needs `through` (a Table instance), `leftKey`, and `rightKey` properties, where `leftKey` and `rightKey` have the same shape as the `key` objects in other relationships
* @param {string} alias - what to call the related instances on this Model
*/
	static belongsToMany(otherModel, key, alias) {
		assert(alias, '`alias` argument is required');
		assert(otherModel, '`otherModel` argument is required');
		assert(key, '`key` argument is required');

		if (!this.associations) {
			this.associations = [];
		}
		let assoc = new Association(this, otherModel, 'manyToMany', key, alias);
		let thisModel = this;
		let fm = this.fieldMap;
		let pool = this._pool;

		Object.defineProperty(this.prototype, alias, {
			get: function () {
				let id = this._id();

				class BelongsToManyCollection extends BaseCollection.of(otherModel) {
					get _baseSelector() {
						let rTable = otherModel.table.tableName;
						let lTable = thisModel.table.tableName;
						let otherFm = otherModel.fieldMap;

						let s = super._baseSelector;
						let f = new Filter({
							[`${lTable}.${fm[assoc._key.leftKey.key]}`]: id
						});

						s.join(
							assoc._key.through.tableName,
							null,
							`${rTable}.${otherFm[assoc._key.rightKey.key]} = ${assoc._key.through.tableName}.${assoc._key.rightKey.references}`
						);

						s.join(
							lTable,
							null,
							`${lTable}.${fm[assoc._key.leftKey.key]} = ${assoc._key.through.tableName}.${assoc._key.leftKey.references}`
						);

						s.where(f.toSql());

						return s;
					}

					get _collectSql() {
						let q = super._collectSql;
						Object.keys(assoc._key.through.schema).forEach(k => {
							if (k !== assoc._key.leftKey.references && k !== assoc._key.rightKey.references) {
								q.field(`${assoc._key.through.tableName}.${k}`, `__context_${k}`);
							}
						});

						return q;
					}

					_removeSql(item, ctx) {
						let q = squel.delete()
							.from(assoc._key.through.tableName);

						let filter = new Filter({
							[assoc._key.leftKey.references]: id,
							[assoc._key.rightKey.references]: item._id(),
							...ctx
						});

						q.where(filter.toSql());

						return q;
					}

					remove(item, ctx) {
						return performQuery(this._removeSql(item, ctx), this.constructor._pool)
							.then(() => item);
					}

					add(newItem, ctx) {
						let action;

						if (newItem[assoc._key.rightKey.key]) {
							action = new otherModel(newItem).fetch();
						} else {
							action = new otherModel(newItem).save();
						}
						return action
							.then(saved => {
								let q = squel.insert()
									.into(assoc._key.through.tableName);

								let joinObject = {
									[assoc._key.leftKey.references]: id,
									[assoc._key.rightKey.references]: saved._id(),
									...ctx
								};

								Object.keys(joinObject).forEach(k => {
									q.set(k, joinObject[k]);
								});

								q.onConflict(`${assoc._key.leftKey.references}, ${assoc._key.rightKey.references}`, ctx);

								return performQuery(q, this.constructor._pool)
									.then(() => saved);
							});
					}

					get association() {
						return assoc;
					}
				}

				BelongsToManyCollection.init(pool);

				return new BelongsToManyCollection();
			}
		});

		this.associations.push(assoc);
	}

	static get table() {
		throw new Error('A model must be backed by a table, but this one is not');
	}

	static mapFields(obj, conf) {
		let newObject = {};

		let prepend = (conf && conf.prepend) || false;

		Object.keys(obj).forEach(k => {
			if (this.fieldMap[k]) {
				if (prepend) {
					newObject[`${this.table.tableName}.${this.fieldMap[k]}`] = obj[k];
				} else {
					newObject[this.fieldMap[k]] = obj[k];
				}
			} else {
				newObject[k] = obj[k];
			}
		});

		return newObject;
	}

	static _inverseMapFields(obj) {
		let newObject = {};
		Object.keys(obj).forEach(k => {
			if (this._inverseFieldMap[k]) {
				newObject[this._inverseFieldMap[k]] = obj[k];
			} else {
				newObject[k] = obj[k];
			}
		});

		return newObject;
	}

/**
* Create a new instance from an ID
* @param {any} id - the ID of the object
*/
	static fromId(id) {
		let key = this.idField;

		return new this({
			[key]: id
		});
	}

	toSqlRow() {
		let obj = {};
		let ifm = this.constructor._inverseFieldMap;

		Object.keys(this.constructor.table.schema).forEach(k => {
			if (this[ifm[k]] === undefined) {
				return;
			}

			if (this[ifm[k]] === null) {
				obj[k] = null;
				return;
			}

			switch (this.constructor.table.schema[k].type) {
				case 'timestamp without time zone':
				case 'timestamp with time zone':
				case 'date':
					if (this[ifm[k]].toISOString) {
						obj[k] = this[ifm[k]].toISOString();
					} else {
						obj[k] = this[ifm[k]];
					}
					break;
				case 'interval':
					obj[k] = moment.duration(this[ifm[k]]).asSeconds().toString();
					break;
				case 'jsonb':
				case 'json':
					if (typeof(this[ifm[k]]) === 'object') {
						obj[k] = JSON.stringify(this[ifm[k]])
					} else {
						obj[k] = this[ifm[k]];
					}
					break;
				default:
					obj[k] = this[ifm[k]];
					break;
			}
		});

		return obj;
	}

	/**
	* Convert a row from `pg` into an instance of this model
	* @param {Object} row - a row from `pg`
	*/
	static fromSQLRow(row) {
		let obj = {};

		Object.keys(row).forEach(k => {
			if (this._inverseFieldMap[k] && this.table.schema[k]) {
				if (row[k] === null) {
					obj[k] = null;
					return;
				}
				switch (this.table.schema[k].type) {
					// Numeric types:
					case 'bigint':
					case 'int':
					case 'smallint':
						if (row[k]) {
							obj[k] = parseInt(row[k], 10);
						} else {
							obj[k] = row[k];
						}
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

	static get idField() {
		let dbkey = this.table.pkey;
		let fm = this.fieldMap;
		let key = Object.keys(fm).find(x => fm[x] === dbkey);

		return key;
	}

	_id() {
		return this[this.constructor.idField];
	}

	/**
	* Generate SQL for updating this instance in the database
	*/
	_updateSql(obj) {
		let table = this.constructor.table;
		let fm = this.constructor.fieldMap;
		let ifm = this.constructor._inverseFieldMap;

		assert(this[this.constructor.idField], `The model must have ${this.constructor.idField} defined in order to update`);

		let q = squel.update()
			.table(table.tableName);

		Object.keys(obj).forEach(k => {
			q.set(fm[k], obj[k]);
		});

		Object.keys(fm).forEach(k => {
			q.returning(`${table.tableName}.${fm[k]}`);
		});

		q.where(`${fm[this.constructor.idField]} = ?`, this[this.constructor.idField]);

		return q;
	}

	/**
	* Generate SQL for saving an instance of this model to the database
	* Note that it will always generate a postgres `upsert` query
	*/
	_saveSql() {
		let table = this.constructor.table;
		let ifm = this.constructor._inverseFieldMap;

		let thisRow = this.toSqlRow();

		let q = squel.insert()
			.into(table.tableName);

		let conflictObject = {};

		Object.keys(table.schema).forEach(k => {
			let ik = ifm[k];
			q.returning(`${table.tableName}.${k}`);

			if (table.schema[k].readOnly) {
				return;
			}

			if (this[ik] === undefined) {
				return;
			}

			if (this[ik] === null && table.schema[k].isPrimaryKey) {
				return;
			}

			if (k !== table.pkey) {
				conflictObject[k] = thisRow[k];
			}

			q.set(k, thisRow[k]);
		});

		q.onConflict(table.pkey, conflictObject);

		return q;
	}

	_fetchSql() {
		assert(this._id(), `Cannot fetch without the ID`);

		let table = this.constructor.table;
		let fm = this.constructor.fieldMap;

		let q = squel.select()
			.from(table.tableName)
			.where(`${table.tableName}.${fm[this.constructor.idField]} = ?`, this._id());

		Object.keys(fm).forEach(k => {
			q.field(`${table.tableName}.${fm[k]}`);
		});

		return q;
	}

	_deleteSql() {
		assert(this._id(), `Cannot delete without the ID`);

		let table = this.constructor.table;
		let fm = this.constructor.fieldMap;

		let q = squel.delete()
			.from(table.tableName)
			.where(`${table.tableName}.${fm[this.constructor.idField]} = ${this._id()}`);

		return q;
	}

	_cloneSql(overrides = {}) {
		let mappedOverrides = this.constructor.mapFields(overrides);

		mappedOverrides[this.constructor.table.pkey] = '__DEFAULT';

		let thisRow = Object.assign(this.toSqlRow(), mappedOverrides);

		let q = squel.insert()
			.into(this.constructor.table.tableName);

		Object.keys(thisRow).forEach(k => {
			if (thisRow[k] === '__DEFAULT') {
				return;
			} else if (!this.constructor.table.schema[k].readOnly) {
				q.set(k, thisRow[k]);
			}
		});

		Object.keys(this.constructor.table.schema).forEach(k => {
			q.returning(`${this.constructor.table.tableName}.${k}`);
		});

		return q;
	}

	/**
	* Create a JSON representation of the instance
	*/
	toJSON() {
		let obj = {};
		let fm = this.constructor.fieldMap;
		let schema = this.constructor.table.schema;

		Object.keys(fm).forEach(k => {
			if (this[k] !== undefined) {
				if (schema[fm[k]].type === 'date' && this[k] !== null && this[k].format) {
					obj[k] = this[k].format().split('T')[0];
				} else {
					obj[k] = this[k];
				}
			}
		});

		if (this.__context) {
			obj.__context = this.__context;
		}

		return obj;
	}

/**
* Delete the instance
*/
	async delete() {
		return performQuery(this._deleteSql(), this.constructor._pool)
			.then(() => null);
	}

/**
* Fetch this instance from the database. This will fill in and update any missing or old data.
*/
	async fetch() {
		return performQuery(this._fetchSql(), this.constructor._pool)
			.then(r => {
				if (!r.rows[0]) {
					return null;
				}

				let newInstance = this.constructor.fromSQLRow(r.rows[0]);

				Object.keys(r.rows[0]).forEach(k => {
					if (this.constructor._inverseFieldMap[k]) {
						this[this.constructor._inverseFieldMap[k]] = newInstance[this.constructor._inverseFieldMap[k]];
					} else {
						this[k] = newInstance[this.constructor._inverseFieldMap[k]];
					}
				});

				return newInstance;
			});
	}

/**
* Create a new row in the database that has the same data as this instance
* @param {object} overrides - override fields of the instance on save
*/
	async clone(overrides) {
		return performQuery(this._cloneSql(overrides), this.constructor._pool)
			.then(r => this.constructor.fromSQLRow(r.rows[0]));
	}

	/**
	* Perform the upsert described by `saveSql`
	*/
	async save() {
		return performQuery(this._saveSql(), this.constructor._pool)
			.then(r => {
				return this.constructor.fromSQLRow(r.rows[0]);
			});
	}

	/**
	* Perform the update described by `updateSql`
	*/
	async update(obj) {
		return performQuery(this._updateSql(obj), this.constructor._pool)
			.then(r => this.constructor.fromSQLRow(r.rows[0]));
	}
}

module.exports = BaseModel;
