let Traits = require('protoduck');

let ManyToMany = Traits.define(['otherModel'], {
	foreignKey: ['otherModel'],
	otherKey: ['otherModel'],
	joinTable: ['otherModel'],

	get: [function(otherModel) {
		let thisTable = this.constructor.associatedCollection.tableName;
		let otherTable = otherModel.associatedCollection.tableName;

		let jt = this.joinTable(new otherModel());
		let fk = this.foreignKey(new otherModel());
		let fk = this.otherKey(new otherModel());

		return new otherModel.associatedCollection()
			.filter({
				[fk.col]: this[fk.val]
			});
	}]
});

module.exports = ManyToMany;

