/* Example Gruntfile
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
    force: {
      options: {
        container: 'test_container',
        tests: '*Test.cls'
      },
      staging: {
        src: ['src/**.cls'],
        options: {
          credentials: 'creds/staging.json'
        }
      },
      production: {
        src: ['src/**.cls'],
        options: {
          credentials: 'creds/production.json'
        }
      },
    }
  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('../tasks');

  // Some convinience handlers
  grunt.registerTask('validate', ['force:production:validate']);
  grunt.registerTask('deploy', ['force:production:deploy']);
  grunt.registerTask('runTests', ['force:production:test']);

  grunt.registerTask('push', ['force:staging:deploy']);
  grunt.registerTask('test', ['force:staging:deploy'])

  // By default, push and run all tests.
  grunt.registerTask('default', ['push', 'test']);

};