/*let Traits = require('protoduck');

let ManyToOne = Traits.define(['otherModel'], {
	foreignKey: ['otherModel'],

	get: [function(otherModel) {
		let thisTable = this.constructor.associatedCollection.tableName
		let otherTable = otherModel.associatedCollection.tableName;

		let fk = this.foreignKey(new otherModel());

		return new .associatedCollection()
			.filter({
				[fk.col]: this[fk.val]
			});
	}]
});

module.exports = ManyToOne;
*/
