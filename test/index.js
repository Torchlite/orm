Promise.all([
	Promise.resolve(require('./unit')),
	require('./integration')
])
	.then(() => console.log('All tests have passed'))
	.then(() => process.exit(0))
	.catch(console.log);
