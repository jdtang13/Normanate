'use strict';


module.exports = function nodemon(grunt) {
    // Load task
    grunt.loadNpmTasks('grunt-nodemon');

    // Options
    return {
        dev: {
            script: 'app.js',
            options: {
                args: [],
                ignore: ['public/**', 'node_modules/**'],
                ext: 'js,html',
                nodeArgs: ['--debug'],
                delayTime: 1,
                env: {
                    PORT: 3000
                },
                cwd: __dirname + '/..'
            }
        }
    };
};
