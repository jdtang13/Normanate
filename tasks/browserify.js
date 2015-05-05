'use strict';


module.exports = function browserify(grunt) {
	// Load task
	grunt.loadNpmTasks('grunt-browserify');

	// Options
	return {
		build: {
			files: {
				'public/build/js/app.js': ['public/js/main.js'],
				'public/build/js/essay.js': ['public/js/views/essay-single.js']
			},
			options: {
				transform: ['debowerify', 'deamdify'],
				watch: true
			}
		}
	};
};
