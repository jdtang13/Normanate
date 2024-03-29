'use strict';


module.exports = function sass(grunt) {
	// Load task
	grunt.loadNpmTasks('grunt-sass');

	// Options
	return {
        build: {
            options: {
                outputStyle: 'compressed'
            },
            files: [{
                expand: true,
                cwd: 'public/css',
                src: ['**/*.scss'],
                dest: 'public/build/css/',
                ext: '.css'
            }]
        }
	};
};
