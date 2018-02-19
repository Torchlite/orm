module.exports = Promise.resolve()
	.then(() => console.log('Running integration tests...'))
	.then(() => require('./CollectionTest'))
	.then(() => require('./ModelTest'))
	.then(() => console.log('Integration tests passed\n'))
	.catch(console.log);
