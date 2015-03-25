'use strict';


module.exports = function (grunt) {

    // Load the project's grunt tasks from a directory
    require('grunt-config-dir')(grunt, {
        configDir: require('path').resolve('tasks')
    });

    // Register group tasks
    grunt.registerTask('build', [ 'jshint', 'sass', 'browserify' ]);
    grunt.registerTask('serve', ['browserify', 'concurrent']);
    grunt.registerTask('test', [ 'jshint', 'mochacli' ]);

};
