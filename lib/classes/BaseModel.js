class BaseModel {
	constructor() {}

	static get associatedCollection() {
		throw new Error('A model must be backed by a collection, but this one is not');
	}
}

module.exports = BaseModel;
