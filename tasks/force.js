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
    var sfdc = require('../lib/force-0.1.0.js');
    var promise = require('node-promise');

    var files = grunt.file.expand(grunt.config.get('force.'+this.target+'.all'));
    if ( !files || files.length == 0 ) {
      return;
    }

    grunt.log.writeln('force plugin executing task '+sftask);
    grunt.log.writeln('loading credentials from '+options.credentials);

    var credfile = grunt.file.read(options.credentials);
    var module = {};
    eval(credfile);
    var creds = module.exports;

    grunt.log.writeln('logging in to '+creds.login_url+' as '+creds.username);

    if ( sftask !== 'deploy' ) {
      grunt.fail.warn('unknown task');
      return 42;
    }

    var conn;
    var data = {};

    sfdc.connect(creds).then(function(c) {
      grunt.log.writeln('logged in successfully');
      conn = c;

      return conn.tooling.insert('MetadataContainer',{'Name':'itefdsjkfdjstContainer'});
    }).then(function(new_id) {

      data.containerId = new_id;
      var junctionInserts = [];

      grunt.log.writeln('created MetadataContainer with Id '+new_id);
      grunt.log.writeln('should be creating junction objects now...');

      function newClassMember(file) {
        var className = file.match(/\/([^\/]*)\.cls/)[1];
        return conn.query('select Id from ApexClass where Name = \''+className+"'").then(function(classes) {
          var classId = classes[0].Id;
          return conn.insert('ApexClassMember', {
          'MetadataContainerId': data.containerId,
          'ContentEntityId': classId,
          'Body': grunt.file.read(file)
          })
        });
      }

      for ( var i = 0; i < files.length; i++ ) {
        grunt.log.writeln('adding file '+files[i]);
        junctionInserts.push(newClassMember(files[i]));
      }

      return promise.all.apply(promise, junctionInserts);
    }).then(function(new_members) {
      grunt.log.writeln('submitting deployment request');

      return conn.tooling.deploy(data.containerId);
    }).then(function(results) {

      grunt.log.writeln('deployment complete');
      done();
    });
  });

};
