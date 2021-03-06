/*
 * force-js - v0.1.0
 * built 2013-02-09
 * https://github.com/couchand/force-js
 * Copyright (c) 2013 Andrew Couch
 * Licensed MIT
 */

"use strict";

// Nodejs libs
var https       = require('https'),
    querystring = require('querystring'),
    promise     = require('node-promise');

function nicehttp(method, host, path, headers, post_data) {
  var buffer = '';
  var waiting = new promise.Deferred();
  var options = {
    method: method,
    host: host,
    path: path,
    headers: headers
  };

  var req = https.request(options, function(res) {
    res.setEncoding('utf8');
    res.on('data', function(data) {
      buffer += data;
    });
    res.on('end', function() {
      waiting.resolve( buffer );
    });
  });

  req.on('error', function(err) {
    waiting.reject( err );
  });

  if ( post_data ) {
    req.write( post_data );
  }

  req.end();

  return waiting;
}

function myget(host, path, headers) {
  return nicehttp( 'GET', host, path, headers );
}

function mypost(host, path, headers, data) {
  return nicehttp( 'POST', host, path, headers, data );
}

function mypatch(host, path, headers, data) {
  return nicehttp( 'PATCH', host, path, headers, data );
}

function mydelete(host, path, headers) {
  return nicehttp( 'DELETE', host, path, headers );
}

function jsonget(host, path, token) {
  return myget(host, path, {
      'Authorization': 'Bearer ' + token
  }).then(function(json) {
    return JSON.parse( json );
  });
}

function jsondelete(host, path, token) {
  return mydelete(host, path, {
      'Authorization': 'Bearer ' + token
  });
}

function querypost(host, path, data){
  var post_data = querystring.stringify(data);
  return mypost(host, path, {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': post_data.length
  }, post_data);
}

function jsonpost(host, path, token, data) {
  var post_data = data ? JSON.stringify( data ) : false;
  return mypost(host, path, {
      'Content-Type': 'application/json',
      'Content-Length': post_data.length,
      'Authorization': 'Bearer ' + token
  }, post_data).then(function(json) {
    return JSON.parse( json );
  });
}

function jsonpatch(host, path, token, data) {
  var patch_data = data ? JSON.stringify( data ) : false;
  return mypatch(host, path, {
      'Content-Type': 'application/json',
      'Content-Length': patch_data.length,
      'Authorization': 'Bearer ' + token
  }, patch_data).then(function(res) {
    return res;
  });
}

// Recursive resource proxies
var RecursiveResource = function RecursiveResource(res,pro){
  this.recursive_resource_name = res;
  this.proxied = pro;
};

RecursiveResource.prototype.get = function(path) {
  return this.proxied.get( '/' + this.recursive_resource_name + path );
};

RecursiveResource.prototype.post = function(path, data) {
  return this.proxied.post( '/' + this.recursive_resource_name + path, data );
};

RecursiveResource.prototype.patch = function(path, data) {
  return this.proxied.patch( '/' + this.recursive_resource_name + path, data );
};

RecursiveResource.prototype.delet = function(path) {
  return this.proxied.delet( '/' + this.recursive_resource_name + path );
};

// Tooling extensions
var Tooling = function Tooling(pro) {
  this.proxied = pro;
};

Tooling.prototype = new RecursiveResource('tooling');

Tooling.prototype.pollForDeployment = function(id, deploymentRequest) {
  var that = this;
  this.getSObject('containerasyncrequest', id).then(function(res) {
    if ( res['State'] === 'Queued' ) {
      deploymentRequest.progress( 'Deployment ' + res.Id + ' still queued.' );
      that.pollForDeployment( id, deploymentRequest );
    }
    else {
      if ( 'Completed' === res['State'] ) {
        deploymentRequest.resolve(res);
      }
      else {
        deploymentRequest.reject(res);
      }
    }
  });
};

Tooling.prototype.deploy = function(container_id, is_check) {
  var that = this;
  var deploymentRequest = new promise.Deferred();
  this.insert('ContainerAsyncRequest', {
    'MetadataContainerId': container_id,
    'IsCheckOnly': is_check
  }).then(function(deploymentId){
    deploymentRequest.progress('Deployment Id: ' + deploymentId);
    that.pollForDeployment(deploymentId, deploymentRequest);
  });
  return deploymentRequest;
};

var Connection = exports.Connection = function(login_url, resource_url, client_id, client_secret) {
  this.login_url = login_url;
  this.resource_url = resource_url;
  this.client_id = client_id;
  this.client_secret = client_secret;
  this.api_version = 'v26.0';
  this.base_path = '/services/data/';

  var that = this;
  this.listVersions().then(function(versions) {
    if ( versions && versions.length && versions[versions.length-1] ) {
      that.api_version = 'v' + versions[versions.length-1].version;
    }
  });

  this.chatter = new RecursiveResource('chatter', this);
  this.connect = new RecursiveResource('connect', this);
  this.tooling = new Tooling(this);
};

Connection.prototype.authorize = function(username, password, token) {
  var that = this;
  var waiting = new promise.Deferred();
  querypost(this.login_url, '/services/oauth2/token', {
    grant_type: 'password',
    client_id: this.client_id,
    client_secret: this.client_secret,
    username: username,
    password: password + token
  }).then(function(res) {
    if ( res ) {
      var result = JSON.parse(res);
      if ( result.access_token ) {
        that.access_token = result.access_token;
        return waiting.resolve(result);
      }
      else if ( result.error_description ) {
        return waiting.reject( result.error_description );
      }
      else if ( result.error ) {
        return waiting.reject( result.error );
      }
      return waiting.reject(result);
    }
    return waiting.reject(res);
  });
  return waiting;
};

exports.connect = function(creds) {
  var connection = new Connection( creds.login_url, creds.resource_url, creds.client_key, creds.client_secret );
  return connection.authorize( creds.username, creds.password, creds.token ).then(function() {
    return connection;
  });
};

Connection.prototype.get = function(path) {
  return jsonget(this.resource_url, this.base_path + this.api_version + path, this.access_token);
};

Connection.prototype.post = function(path, data) {
  return jsonpost(this.resource_url, this.base_path + this.api_version + path, this.access_token, data);
};

Connection.prototype.patch = function(path, data) {
  return jsonpatch(this.resource_url, this.base_path + this.api_version + path, this.access_token, data);
};

Connection.prototype.delet = function(path) {
  return jsondelete(this.resource_url, this.base_path + this.api_version + path, this.access_token);
};

// The one method you don't need to be authorized for
Connection.prototype.listVersions = function() {
  return jsonget(this.resource_url, this.base_path);
};

RecursiveResource.prototype.listResources =
Connection.prototype.listResources = function() {
  return this.get('/');
};

Connection.prototype.listRecent = function() {
  return this.get('/recent');
};

Tooling.prototype.listSObjects =
Connection.prototype.listSObjects = function() {
  return this.get('/sobjects').then(function(res) {
    return res['sobjects'];
  });
};

Tooling.prototype.getSObject =
Connection.prototype.getSObject = function(type, id) {
  return this.get('/sobjects/' + type + '/' + id);
};

Connection.prototype.search = function(query) {
  return this.get('/search?q=' + querystring.escape(query));
};

Tooling.prototype.query =
Connection.prototype.query = function (query) {
  var path = '/query?q=' + querystring.escape(query);
  return this.get(path).then(function(res){
    return res["records"];
  });
};

Tooling.prototype.insert =
Connection.prototype.insert = function (type, data) {
  var path = '/sobjects/' + type;
  return this.post(path, data).then(function(res){
    return res["id"];
  });
};

Tooling.prototype.update =
Connection.prototype.update = function (type, id, data) {
  var path = '/sobjects/' + type + '/' + id;
  return this.patch(path, data);
};

Tooling.prototype.destroy =
Connection.prototype.destroy = function (type, id) {
  var path = '/sobjects/' + type + '/' + id;
  return this.delet(path);
};

Tooling.prototype.describe =
Connection.prototype.describe = function(type) {
  var path = '/sobjects/' + type + '/describe';
  return this.get(path);
};

Connection.prototype.pollForResults = function(queueitemid, callback){
  var that = this;
  this.query("SELECT Id, Status FROM ApexTestQueueItem WHERE Id = '" + queueitemid + "'").then(function(res){
    if ( res[0]["Status"] !== 'Aborted' && res[0]["Status"] !== 'Completed' && res[0]["Status"] !== 'Failed' ){
      that.pollForResults(queueitemid, callback);
    }
    else {
      that.query("SELECT Id, Outcome, Message, StackTrace, ApexClass.Name, MethodName " +
                 "FROM ApexTestResult WHERE QueueItemId = '" + queueitemid + "'").then(callback);
    }
  });
};

Connection.prototype.testId = function(apexclassid) {
  var that = this;
  var waiting = new promise.Deferred();
  this.insert('ApexTestQueueItem', { ApexClassId: apexclassid }).then(function(newid){
    that.pollForResults(newid, function(res) {
      waiting.resolve(res);
    });
  });
  return waiting;
};

Connection.prototype.test = function(apexclassname) {
  var that = this;
  return this.query('select id, name from apexclass where name = \'' + apexclassname + '\'').then(function(res){
    return res[0].Id;
  }).then(function(id){
    return that.testId(id);
  });
};
