'use strict';


module.exports = function less(grunt) {
    // Load task
    grunt.loadNpmTasks('grunt-contrib-less');

    // Options
    return {
        build: {
            options: {
                outputStyle: 'compressed'
            },
            files: {
                'public/build/css/main.css': 'public/css/main.less'
            }
        }
    };
};
