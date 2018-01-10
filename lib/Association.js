class Association {
	constructor(lModel, rModel, type, key, alias) {
		this._lModel = lModel;
		this._rModel = rModel;
		this._type = type;
		this._key = key;
		this._alias = alias;
	}
}

module.exports = Association;
