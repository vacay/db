/* global require, module, __dirname */

var fs = require('fs')
var path = require('path')

var email = require('vacay-email')

module.exports = function(config) {

  var log = require('log')(config.log)
  var sendEmail = email({ ses: config.ses })

  var knex = require('knex')({
    client: 'mysql',
    connection: config.mysql,
    pool: {
      min: 0,
      max: 10
    },
    debug: config.debug ? config.debug : false
  });
  var db = require('bookshelf')(knex);

  db.plugin('registry');
  db.plugin('visibility');

  db.Model = db.Model.extend({

    hasTimestamps: true

  }, {

    findAll: function (options) {
      options = options || {};
      return db.Collection.forge([], {
	model: this
      }).fetch(options);
    },

    browse: function () {
      return this.findAll.apply(this, arguments);
    },

    findOne: function (args, options) {
      options = options || {};
      return this.forge(args).fetch(options);
    },

    read: function () {
      return this.findOne.apply(this, arguments);
    },

    edit: function (editedObj) {
      return this.forge({
	id: editedObj.id
      }).save(editedObj, {
	method: 'update',
	patch: true
      });
    },

    update: function () {
      return this.edit.apply(this, arguments);
    },

    add: function (newObj) {
      return this.forge(newObj).save();
    },

    create: function () {
      return this.add.apply(this, arguments);
    },

    destroy: function (_identifier, options) {
      options = options || {};
      return this.forge({
	id: _identifier
      }).destroy(options);
    },

    'delete': function () {
      return this.destroy.apply(this, arguments);
    },

    findOrCreate: function(args, cb) {
      var self = this;
      self.forge(args).fetch().asCallback(function(err, existingObj) {
	if (existingObj) return cb(err, existingObj);
	return self.forge(args).save().asCallback(cb);
      });
    }
  });

  var modelsDir = __dirname + '/models';
  fs.readdirSync(modelsDir).sort().forEach(function(file) {
    if (/\.js$/.test(file)) require(path.join(modelsDir, file))({
      db: db,
      log: log,
      sendEmail: sendEmail,
      config: config
    })
  });

  return db;

};
