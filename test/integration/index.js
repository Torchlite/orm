module.exports = Promise.all([
	require('./CollectionTest')
])
	.then(() => console.log('Integration tests passed'));
