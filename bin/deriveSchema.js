#!/usr/bin/env node
const { Client } = require('pg');
const Promise = require('bluebird');
const fs = require('fs');
const commandLineArgs = require('command-line-args');
const getUsage = require('command-line-usage');

const argSchema = [
	{ name: 'db_url', alias: 'd', type: String },
	{ name: 'output', alias: 'o', type: String },
	{ name: 'help', alias: 'h', type: String }
];

const usage = [
	{
		header: 'Schema Derive',
		content: 'Generates JSON for use with Torchlite ORM Models and Collections'
	},
	{
		header: 'Options',
		optionList: [
			{
				name: 'db_url',
				typeLabel: '[underline]{db_url}',
				description: 'Database URL to look at'
			},
			{
				name: 'output',
				typeLabel: '[underline]{output}',
				description: 'Location to write the file.'
			},
			{
				name: 'help',
				description: 'Print this usage guide.'
			}
		]
	}
];

const args = commandLineArgs(argSchema);

const client = new Client({
	connectionString: args.db_url;
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
		let data = `// This file is generated
module.exports = ${JSON.stringify(schema, null, 5)}
`;
		return fs.writeFileSync(args.output, data);
	})
	.then(() => process.exit(0))
	.catch(console.log);

