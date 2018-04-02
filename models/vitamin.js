/* global require, module */

var async		= require('async')
var s3			= require('s3')
var elasticsearch	= require('elasticsearch')

module.exports = function (opts) {

  var s3client = s3.createClient({
    s3Options: {
      accessKeyId: opts.config.s3.key,
      secretAccessKey: opts.config.s3.secret
    }
  });

  var es = new elasticsearch.Client({
    hosts: opts.config.elasticsearch.hosts
  });

  var Vitamin = opts.db.Model.extend({

    tableName: 'vitamins',

    constructor: function() {
      opts.db.Model.apply(this, arguments);

      this.on('updating', function(model, attrs) {
	if (model.attributes.title && model.hasChanged('title')) {
	  attrs.original = null;
	  attrs.variation = null;
	  model.artists().detach();
	}
      });

      this.on('destroyed', function(model) {

	//delete from elasticsearch
	es.delete({
	  index: 'vcy',
	  type: 'vitamins',
	  id: model.previous('id')
	}, function(err) {
	  if (err) opts.log.error(err);
	});

	//delete waveform from s3
	s3client.deleteObjects({
	  Bucket: 'vacay',
	  Delete: {
	    Objects: [
	      {
		Key: opts.config.s3.folder + '/waveforms/' + model.previous('id') + '.png'
	      }
	    ],
	    Quiet: true
	  }
	}).on('error', opts.log.error);

	//delete media from s3
	s3client.deleteObjects({
	  Bucket: 'vacay',
	  Delete: {
	    Objects: [
	      {
		Key: opts.config.s3.folder + '/vitamins/' + model.previous('id') + '.mp3'
	      }
	    ],
	    Quiet: true
	  }
	}).on('error', opts.log.error);
      });
    },

    artists: function() {
      return this.belongsToMany('Artist').withPivot(['type']);
    },

    hosts: function () {
      return this.hasMany('Host');
    },

    craters: function() {
      return this.belongsToMany('User', 'crates', 'vitamin_id', 'user_id');
    },

    taggers: function() {
      return this.belongsToMany('User', 'tags', 'vitamin_id', 'user_id');
    },

    tags: function() {
      return this.hasMany('Tag');
    },

    pages: function() {
      return this.belongsToMany('Page').withPivot(['created_at']);
    },

    prescribers: function() {
      return opts.db.knex
	.select('users.id', 'users.name','users.username','users.avatar','users.bio','users.location','users.created_at', 'users.updated_at')
	.table('users')
	.innerJoin('prescriptions', 'prescriptions.prescriber_id', 'users.id')
	.innerJoin('prescriptions_vitamins', 'prescriptions_vitamins.prescription_id', 'prescriptions.id')
	.where('prescriptions_vitamins.vitamin_id', this.id)
	.groupBy('users.id');
    },

    publishers: function() {
      return this.belongsToMany('User', 'crates', 'vitamin_id', 'user_id');
    },

    prescriptions: function () {
      return this.belongsToMany('Prescription');
    }

  }, {

    /**
     data:
     - title
     - duration
     - url
     - host
     - id (host)
     - created_at (host)
     - stream_url
     **/
    findOrCreate: function(data, cb) {
      opts.db.knex('hosts').select().where({
	title: data.host,
	identifier: data.id
      }).asCallback(function(err, host) {
	if (err) {
	  cb(err, null);
	  return;
	}

	if (host.length) {
	  opts.db.model('Vitamin').findOne({id: host[0].vitamin_id}).asCallback(cb);
	  return;
	}

	async.waterfall([
	  function (next) {
	    opts.db.model('Vitamin').forge({
	      title: data.title,
	      duration: data.duration
	    }).save().asCallback(next);
	  },

	  function (vitamin, next) {
	    opts.db.knex('hosts').insert({
	      url: data.url,
	      title: data.host,
	      identifier: data.id || (data.host === 'vacay' ? vitamin.attributes.id : null),
	      stream_url: data.stream_url,
	      artwork_url: data.artwork_url,
	      vitamin_title: data.title,
	      vitamin_id: vitamin.attributes.id,
	      user_id: data.user_id
	    }).asCallback(function (err) {
	      next(err, vitamin);
	    });
	  }
	], cb);
      });
    }
  });

  opts.db.model('Vitamin', Vitamin);
};
