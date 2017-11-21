class ORM {
	constructor();
}

module.exports = {
	associations: {
		ManyToMany: require('./associations/ManyToMany'),
		ManyToOne: require('./associations/ManyToOne'),
		OneToMany: require('./associations/OneToMany')
	},
	classes: {
		BaseCollection: require('./classes/BaseCollection'),
		BaseModel: require('./classes/BaseModel'),
		Filter: require('./classes/Filter')
	}
};
