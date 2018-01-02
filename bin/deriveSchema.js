#!/usr/bin/env node
require('dotenv').config();

const { Client } = require('pg');
const Promise = require('bluebird');
const fs = require('fs');

const client = new Client({
	connectionString: process.env.DATABASE_URL
});

const colsQuery = tableName => {
	return `
		select
			column_name,
			data_type
		from
			information_schema.columns
		where
			table_name = '${tableName}'`;
};

const tablesQuery = `
	select
		table_name
	from
		information_schema.tables
	where
		table_name not like '\\_\\_%' and
		table_schema = 'public';`;

const pkQuery = tableName => {
	return `
		select
			a.attname
		FROM
			pg_index i JOIN
			pg_attribute a ON
				a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
		WHERE
			i.indrelid = '${tableName}'::regclass
		AND
			i.indisprimary`;
};

let schema = {};

client
	.connect()
	.then(() => client.query(tablesQuery))
	.then(r => r.rows.map(x => x.table_name))
	.then(tables => {
		return Promise.map(tables, t => {
			let tSchema = {};
			return client
				.query(colsQuery(t))
				.then(result => {
					result.rows.forEach(row => {
						tSchema[row.column_name] = { type: row.data_type };
					});
				})
				.then(() => (schema[t] = tSchema));
		}).then(() => tables);
	})
	.then(tables => {
		return Promise.map(tables, t => {
			return client.query(pkQuery(t)).then(r => {
				if (r.rowCount !== 1) {
					return;
				}

				schema[t][r.rows[0].attname].isPrimaryKey = true;
			});
		});
	})
	.then(() => {
		const ordered = {};
		Object.keys(schema).sort().forEach(k => {
			ordered[k] = schema[k];
		});

		const data = JSON.stringify(ordered);

		return fs.writeFileSync('schema.json', data);
	})
	.then(() => process.exit(0))
	.catch(console.log);
