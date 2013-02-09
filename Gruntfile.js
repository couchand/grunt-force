/*
 * grunt-force
 * https://github.com/couchand/grunt-force
 *
 * Copyright (c) 2013 Andrew Couch
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/*.js',
        '<%= nodeunit.tests %>',
      ],
      options: {
        jshintrc: '.jshintrc',
      },
    },

    // Before generating any new files, remove any previously-created files.
    clean: {
      tests: ['tmp'],
    },

    // Configuration to be run (and then tested).
    force: {
      options: {
        container: 'test_container',
        tests: '*Test.cls'
      },
      staging: {
        src: ['test/fixtures/*.cls'],
        options: {
          credentials: 'test/creds/staging.js'
        }
      },
      production: {
        src: ['test/fixtures/*.cls'],
        options: {
          credentials: 'test/creds/production.js'
        }
      },
    },

    // Unit tests.
    nodeunit: {
      tests: ['test/*_test.js'],
    },

  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  // Whenever the "test" task is run, first clean the "tmp" dir, then run this
  // plugin's task(s), then test the result.
  grunt.registerTask('test', ['clean', 'force', 'nodeunit']);

  grunt.registerTask('validate', ['force:production:validate']);
  grunt.registerTask('deploy', ['force:production:deploy']);
  grunt.registerTask('runTests', ['force:production:test']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test']);

};
