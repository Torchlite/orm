'use strict';
let EventEmitter = require('events');
let assert = require('assert');

/**
* Powers the Trait-like functionality of Models
*/
class Mixable extends EventEmitter {
	static with(mixins) {
		assert(Array.isArray(mixins), '`mixins` should be an array of mixins');
		let newClass = this;

		mixins.forEach(m => {
			newClass = m(newClass);
		});

		return newClass;
	}
}

module.exports = Mixable;
