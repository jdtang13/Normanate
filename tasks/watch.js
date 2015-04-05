'use strict';


module.exports = function watch(grunt) {
    // Load task
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Options
    return {
        
        html: {
            files: ['server/views/**/*'],
            options: {
                livereload: true
            }
        },
        scss: {
            files: ['public/css/**/*.scss'],
            tasks: ['sass'],
            options: {
                livereload: true
            }
        },
        less: {
            files: ['public/css/**/*.less'],
            tasks: ['less'],
            options: {
                livereload: true
            }
        }
    };
};
