let assert = require('assert');

let squel = require('squel').useFlavour('postgres');
let moment = require('moment');
let Association = require('./Association');
let BaseCollection = require('./BaseCollection');
let Filter = require('./Filter');

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

	static init(pool) {
		this._pool = pool;
	}

	static hasMany(otherModel, key, alias) {
		if (!this.associations) {
			this.associations = [];
		}

		let assoc = new Association(this, otherModel, 'oneToMany', key, alias);
		let pool = this._pool;

		Object.defineProperty(this.prototype, alias, {
			get: function () {
				let fm = this.constructor.fieldMap;
				let assoc = this.constructor
					.associations
					.find(a => a._rModel === otherModel);

				let id = this[assoc._key.key];

				class HasManyCollection extends BaseCollection.of(otherModel) {
					static get _baseSelector() {
						let s = super._baseSelector;
						let f = new Filter({
							[fm[assoc._key.key]]: id
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

	static belongsTo(otherModel, key, alias) {
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

	static belongsToMany(otherModel, key, alias) {
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

					get _collectSelector() {
						let q = super._collectSelector;
						Object.keys(assoc._key.through.schema).forEach(k => {
							q.field(`${assoc._key.through.tableName}.${k}`, `__context_${k}`);
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

						return q.toString();
					}

					remove(item, ctx) {
						return this.constructor._pool.query(this._removeSql(item, ctx))
							.then(() => item);
					}

					add(newItem, ctx) {
						let action;

						if (newItem[assoc._key.rightKey.references]) {
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

								return this.constructor._pool.query(q.toString())
									.then(() => saved);
							})
							.catch(console.log);
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

	static mapFields(obj) {
		let newObject = {};
		Object.keys(obj).forEach(k => {
			if (this.fieldMap[k]) {
				newObject[this.fieldMap[k]] = obj[k];
			} else {
				newObject[k] = obj[k];
			}
		});

		return newObject;
	}

	static fromId(id) {
		let key = this._inverseFieldMap[this.table.pkey];

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
					obj[k] = this[ifm[k]].toISOString();
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

	_cloneSql(overrides = {}) {
		let mappedOverrides = this.constructor.mapFields(overrides);

		mappedOverrides[this.constructor.table.pkey] = '__DEFAULT';

		let thisRow = Object.assign(this.toSqlRow(), mappedOverrides);

		let q = squel.insert()
			.into(this.constructor.table.tableName);

		Object.keys(thisRow).forEach(k => {
			if (thisRow[k] === '__DEFAULT') {
				q.set(k, 'DEFAULT', { dontQuote: true });
			} else {
				q.set(k, thisRow[k]);
			}
		});

		Object.keys(this.constructor.table.schema).forEach(k => {
			q.returning(k);
		});

		return q.toString();
	}

	async fetch() {
		return this.constructor._pool.query(this._fetchSql())
			.then(r => this.constructor.fromSQLRow(r.rows[0]));
	}

	async clone(overrides) {
		return this.constructor._pool.query(this._cloneSql(overrides))
			.then(r => this.constructor.fromSQLRow(r.rows[0]));
	}

	/**
	* Perform the upsert described by `saveSql`
	*/
	async save() {
		return this.constructor._pool.query(this._saveSql())
			.then(r => {
				return this.constructor.fromSQLRow(r.rows[0]);
			});
	}

	/**
	* Perform the update described by `updateSql`
	*/
	async update(obj) {
		return this.constructor._pool.query(this._updateSql(obj))
			.then(r => new this.constructor(r.rows[0]));
	}
}

module.exports = BaseModel;
