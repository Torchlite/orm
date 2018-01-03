class Association {
	constructor(lModel, rModel, type, key, through) {
		this._lModel = lModel;
		this._rModel = rModel;
		this._type = type;
		this._key = key;
	}
}

module.exports = Association;
