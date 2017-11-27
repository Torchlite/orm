let Traits = require('protoduck');

let ManyToOne = Traits.define(['otherModel'], {
	foreignKey: ['otherModel'],

	get: [function(otherModel) {
		let thisTable = this.constructor.associatedCollection.baseTable.tableName
		let otherTable = otherModel.associatedCollection.baseTable.tableName;

		let fk = this.foreignKey(new otherModel());

		return new otherModel.associatedCollection()
			.filter({
				[fk.col]: this[fk.val]
			});
	}]
});

module.exports = ManyToOne;
