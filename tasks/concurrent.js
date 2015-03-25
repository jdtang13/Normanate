'use strict';


module.exports = function concurrent(grunt) {
    // Load task
    grunt.loadNpmTasks('grunt-concurrent');

    // Options
    return {
        
        dev: {
            tasks: ['nodemon', 'watch'],
            options: {
                logConcurrentOutput: true
            }
        }
    };
};
