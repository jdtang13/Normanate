'use strict';


module.exports = function (grunt) {

    // Load the project's grunt tasks from a directory
    require('grunt-config-dir')(grunt, {
        configDir: require('path').resolve('tasks')
    });

    // Register group tasks
    grunt.registerTask('build', [ 'less', 'browserify' ]);
    grunt.registerTask('serve', ['less', 'browserify', 'concurrent']);
    grunt.registerTask('test', [ 'jshint', 'mochacli' ]);

};
