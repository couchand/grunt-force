/*
 * grunt-force
 * https://github.com/couchand/grunt-force
 *
 * Copyright (c) 2013 Andrew Couch
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  grunt.registerMultiTask('force', 'Interact with a Salesforce.com environment', function(sftask) {
    var done = this.async();
    var options = this.options();
    var file_groups = this.files;
    var task;

    grunt.log.writeln('force plugin executing task '+sftask);

    if ( sftask === 'validate' ) {
      options.isCheck = true;
      task = deploy;
    }
    else if ( sftask === 'deploy' ) {
      task = deploy;
    }
    else if ( sftask === 'test' ) {
      task = test;
    }
    else {
      grunt.fail.warn('unknown task');
      return 42;
    }

    login(options).then(function(conn) {
      return task(conn, file_groups, options);
    }).then(done);
  });

  function login(options) {
    var sfdc = require('../lib/force-0.1.0.js');

    grunt.log.writeln('loading credentials from '+options.credentials);

    var credfile = grunt.file.read(options.credentials);
    var module = {};
    eval(credfile);
    var creds = module.exports;

    grunt.log.writeln('logging in to '+creds.login_url+' as '+creds.username);

    return sfdc.connect(creds).then(function(c) {
      grunt.log.writeln('logged in successfully');
      return c;
    });
  }

  function test(conn, file_groups, options) {
    var promise = require('node-promise');
    var data = {};

    grunt.log.writeln('running tests');

    var testRuns = [];

    // Iterate over all specified file groups.
    file_groups.forEach(function(fileObj) {
      // The source files to be concatenated. The "nonull" option is used
      // to retain invalid files/patterns so they can be warned about.
      var files = grunt.file.expand({nonull: true}, fileObj.src);

      files.map(function(filepath) {
        var class_name = filepath.match(/\/([^\/]*)\.cls$/)[1];

        testRuns.push(conn.test(class_name));
      });
    });

    return promise.allOrNone.apply(promise, testRuns).then(function(runs) {
      var success = true;
      runs.forEach(function(results) {
        results.forEach(function(res) {
          success = success && res.Outcome === 'Pass';
          var stack_trace = res.StackTrace && res.StackTrace.replace(/\n/g, "\n > ");
          var test_result = 'Test ' + res.ApexClass.Name + '.' + res.MethodName + ': ' + res.Outcome +
                            (res.Outcome !== 'Pass' ? ' - ' + res.Message + '.\n > ' + stack_trace : '');
          grunt.log.writeln(test_result);
        });
      });
      if ( success ) {
        grunt.log.writeln('All tests pass.');
      }
      else {
        grunt.fail.warn('test failures.');
      }
    });
  }

  function deploy(conn, file_groups, options) {
    var promise = require('node-promise');
    var data = {};

    grunt.log.writeln('looking for container');

    return conn.tooling.query('select Id from MetadataContainer where Name = \'' + options.container + "'").then(function(containers) {
      if ( containers && containers.length ) {
        grunt.log.writeln('found container');
        // found container, use it
        var now = new promise.Deferred();
        now.resolve( containers[0].Id );
        return now;
      }
      return conn.tooling.insert('MetadataContainer', { 'Name': options.container });
    }).then(function(new_id) {

      data.containerId = new_id;
      var junctionInserts = [];

      grunt.log.writeln('created MetadataContainer with Id '+new_id);
      grunt.log.writeln('creating junction objects now...');

      // Iterate over all specified file groups.
      file_groups.forEach(function(fileObj) {
        // The source files to be concatenated. The "nonull" option is used
        // to retain invalid files/patterns so they can be warned about.
        var files = grunt.file.expand({nonull: true}, fileObj.src);

        files.map(function(filepath) {
          var class_name = filepath.match(/\/([^\/]*)\.cls$/)[1];

          // Warn if a source file/pattern was invalid.
          if (!grunt.file.exists(filepath)) {
            grunt.log.error('Source file "' + filepath + '" not found.');
            return '';
          }

          grunt.log.writeln('adding class ' + class_name);

          junctionInserts.push(
            conn.query('select Id from ApexClass where Name = \''+class_name+"'").then(function(classes) {
              var classId = classes[0].Id;
              grunt.log.writeln('found class '+class_name+' with id '+classId);

              grunt.log.writeln('searching for classmember');
              return conn.tooling.query('select Id from ApexClassMember where MetadataContainerId = \'' +
                                  data.containerId + '\' and ContentEntityId = \'' + classId + "'").then(function(acms) {
                if ( acms && acms.length ) {
                  grunt.log.writeln('found classmember with id '+acms[0].Id);
                  var acmId = acms[0].Id;
                  return conn.tooling.update('ApexClassMember', acmId, {
                    'Body': grunt.file.read(filepath)
                  });
                }

                grunt.log.writeln('creating classmember');
                return conn.tooling.insert('ApexClassMember', {
                  'MetadataContainerId': data.containerId,
                  'ContentEntityId': classId,
                  'Body': grunt.file.read(filepath)
                }).then(function(new_id) {
                  if ( !new_id ) {
                    grunt.fail.fatal('error inserting junction object');
                  }
                  grunt.log.writeln('inserted acm for class '+class_name+' new id is '+new_id);
                  return new_id;
                }, function(err){
                  grunt.fail.fatal('error inserting junction object: '+err);
                });
              });
            })
          );
        });
      });

      grunt.log.writeln('added ' + junctionInserts.length + ' classes');
      grunt.log.writeln('waiting for all adds to complete');
      return promise.allOrNone.call(promise, junctionInserts);
    }).then(function(new_members) {
      grunt.log.writeln('added '+new_members.length);
      grunt.log.writeln('all adds complete');

      grunt.log.writeln('submitting deployment request');

      return conn.tooling.deploy(data.containerId, options.isCheck);
    }).then(function(results) {

      grunt.log.writeln( (options.isCheck?'validation':'deployment') + ' complete');
    }, function(e) {
      var errors = '', i, err;

      var compile = e.CompilerErrors && JSON.parse( e.CompilerErrors );

      if ( e.CompilerErrors && compile.length ) {
        for ( i = 0; i < compile.length; i++ ) {
          err = compile[i];
          errors += 'CompilerError: ' + err.extent + ' ' + err.name + ' (line ' + err.line + '): ' + err.problem + "\n";
        }
      }

      if ( e.ErrorMsg ) {
        errors = e.ErrorMsg + "\n" + errors;
      }

      grunt.fail.fatal( errors );
    });
  }

};
