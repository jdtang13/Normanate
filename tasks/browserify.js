'use strict';


module.exports = function browserify(grunt) {
	// Load task
	grunt.loadNpmTasks('grunt-browserify');

	// Options
	return {
		build: {
			files: {
				'public/build/js/app.js': ['public/js/main.js'],
			},
			options: {
				transform: ['debowerify', 'deamdify'],
				watch: true
			}
		}
	};
};
