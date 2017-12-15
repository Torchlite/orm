Promise.all([
	Promise.resolve(require('./unit')),
	require('./integration')
])
	.then(() => console.log('All tests have passed'))
	.catch(console.log);
