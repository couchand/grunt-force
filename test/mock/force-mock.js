"use strict";

var promise = require('node-promise');

// Tooling extensions
var Tooling = function Tooling() {};

Tooling.prototype.deploy = function(container_id, is_check) {
  var deploymentRequest = new promise.Deferred();

  // TODO: do something

  return deploymentRequest;
};

var Connection = exports.Connection = function(login_url, resource_url, client_id, client_secret) {
  this.login_url = login_url;
  this.resource_url = resource_url;
  this.client_id = client_id;
  this.client_secret = client_secret;

  //this.chatter = new RecursiveResource('chatter', this);
  //this.connect = new RecursiveResource('connect', this);
  this.tooling = new Tooling(this);
};

Connection.prototype.authorize = function(username, password, token) {
  var waiting = new promise.Deferred();

  // TODO: do something

  return waiting;
};

Connection.prototype.get = function(path) {
  // TODO: do something
};

Connection.prototype.post = function(path, data) {
  // TODO: do something
};

Connection.prototype.patch = function(path, data) {
  // TODO: do something
};

Connection.prototype.delet = function(path) {
  // TODO: do something
};

Connection.prototype.listVersions = function() {
  // TODO: do something
};

Connection.prototype.listResources = function() {
  // TODO: do something
};

Connection.prototype.listRecent = function() {
  // TODO: do something
};

Tooling.prototype.listSObjects =
Connection.prototype.listSObjects = function() {
  // TODO: do something
};

Tooling.prototype.getSObject =
Connection.prototype.getSObject = function(type, id) {
  // TODO: do something
};

Connection.prototype.search = function(query) {
  // TODO: do something
};

Tooling.prototype.query =
Connection.prototype.query = function (query) {
  // TODO: do something
};

Tooling.prototype.insert =
Connection.prototype.insert = function (type, data) {
  // TODO: do something
};

Tooling.prototype.update =
Connection.prototype.update = function (type, id, data) {
  // TODO: do something
};

Tooling.prototype.destroy =
Connection.prototype.destroy = function (type, id) {
  // TODO: do something
};

Tooling.prototype.describe =
Connection.prototype.describe = function(type) {
  // TODO: do something
};

Connection.prototype.test = function(apexclassname) {
  // TODO: do something
};
