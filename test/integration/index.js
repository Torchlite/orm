module.exports = Promise.resolve()
	.then(() => console.log('Running integration tests...'))
	.then(() => require('./CollectionTest'))
	.then(() => console.log('Integration tests passed\n'))
	.catch(console.log);
