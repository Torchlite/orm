# Wellspring

Wellspring is an ORM for interacting with Postgres via NodeJS

## Building and showing the docs

Wellspring uses JsDoc for documentation, so the docs are inline. You can also build them locally by running

`npm run build-docs`

Once the docs are built, you can launch a server to show them with

`npm run docs`

which starts a server on port 8080.

You can do both with `npm run build-docs && npm run docs`.

## Note
Versions >= 0.2.0 require PostgreSQL >= 11.0. If you're running on an older
version of PostgreSQL, install version 0.1.0.
