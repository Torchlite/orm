#!/usr/bin/env node
require('dotenv').config();

const { Client } = require('pg');
const Promise = require('bluebird');
const fs = require('fs');

const useSSL = process.env.DATABASE_SSL === 'true';

const client = new Client({
	connectionString: process.env.DATABASE_URL + (useSSL ? '?ssl=true' : '')
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

const virtualColsQuery = (tableName, typeCase) => {
	return `
		SELECT
			p.proname as "name",
			pg_catalog.pg_get_function_result(p.oid) as "type",
			CASE
                ${typeCase}
				WHEN p.prorettype = 'pg_catalog.trigger'::pg_catalog.regtype THEN 'trigger'
				ELSE 'normal'
			END as "Type"
		FROM
			pg_catalog.pg_proc p LEFT JOIN
			pg_catalog.pg_namespace n ON n.oid = p.pronamespace
		WHERE pg_catalog.pg_function_is_visible(p.oid)
			AND n.nspname <> 'pg_catalog'
			AND n.nspname <> 'information_schema'
			AND pg_catalog.pg_get_function_arguments(p.oid) like '%${tableName}';
	`;
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
	.then(tables =>
		client
			.query('SHOW server_version')
			.then(r => [Number(r.rows[0].server_version.slice(0, 2)), tables])
	)
	.then(([version, tables]) => {
		const typeCase =
			version >= 11
				? `
            WHEN p.prokind = 'a' THEN 'agg'
            WHEN p.prokind = 'w' THEN 'window'
        `
				: `
            WHEN p.proisagg THEN 'agg'
            WHEN p.proiswindow THEN 'window'
        `;
		return Promise.map(tables, t => {
			let tSchema = {};
			return Promise.all([client.query(colsQuery(t)), client.query(virtualColsQuery(t, typeCase))])
				.then(([cols, vcols]) => {
					cols.rows.forEach(row => {
						tSchema[row.column_name] = { type: row.data_type };
					});

					vcols.rows.forEach(row => {
						tSchema[row.name] = {
							type: row.type,
							readOnly: true
						};
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
		Object.keys(schema)
			.sort()
			.forEach(k => {
				const innerOrdered = {};
				Object.keys(schema[k])
					.sort()
					.forEach(k2 => {
						innerOrdered[k2] = schema[k][k2];
					});

				ordered[k] = innerOrdered;
			});

		const data = JSON.stringify(ordered, null, '\t');

		return fs.writeFileSync('schema.json', data);
	})
	.then(() => process.exit(0))
	.catch(console.log);
