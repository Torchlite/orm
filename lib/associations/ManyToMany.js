let Traits = require('protoduck');

let ManyToMany = Traits.define(['otherModel'], {
	foreignKey: ['otherModel'],
	otherKey: ['otherModel'],
	joinTable: ['otherModel'],

	get: [function(otherModel) {
		let thisTable = this.constructor.associatedCollection.tableName;
		let otherTable = otherModel.associatedCollection.tableName;
		let otherInstance = new otherModel();

		let jt = this.joinTable(otherInstance);
		let fk = this.foreignKey(otherInstance);
		let fk = this.otherKey(otherInstance);

		return new otherModel.associatedCollection()
			.filter({
				[fk.col]: this[fk.val]
			});
	}]
});

module.exports = ManyToMany;

