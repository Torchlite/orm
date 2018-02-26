module.exports = (q, pool) => {
	let { text, values } = q.toParam();

	return pool.query(text, values);
}
