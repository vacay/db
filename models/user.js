/* global require, module */

var bcrypt	= require('bcrypt')
var async	= require('async')
var CheckIt	= require('checkit')

module.exports = function (opts) {

  var User = opts.db.Model.extend({

    tableName: 'users',

    hidden: ['password', 'email'],

    validate: function(model, attrs, options) {
      if (model.attributes.name && model.attributes.name.sql && model.attributes.name.sql.indexOf('SELECT * FROM (SELECT MAX(id) FROM users) as tmptable') !== -1) {
	return new CheckIt({
	  email: ['email']
	}).run(this.toJSON());
      }

      return new CheckIt({
	username: ['minLength:1', 'maxLength:25'],
	email: ['email'],
	name: ['minLength:1', 'maxLength:35'],
	avatar: ['url'],
	cover: ['url'],
	bio: ['minLength:1', 'maxLength:500'],
	location: ['minLength:1', 'maxLength:100']
      }).run(this.toJSON());
    },

    constructor: function() {
      opts.db.Model.apply(this, arguments);

      this.on('saving', this.validate, this);

      this.on('destroying', function(model) {
	model.prescriptions().fetch().asCallback(function(err, prescriptions) {
	  async.eachSeries(prescriptions, function(prescription, done) {
	    prescription.destroy().asCallback(done);
	  }, function(err) {
	    if (err) opts.log.error(err);
	  });
	});
      });

      this.on('destroyed', function(model) {

	opts.db.knex('discussions').update({
	  user_id: 0
	}).where({
	  user_id: model.previous('id')
	}).asCallback(function(err) {
	  if (err) opts.log.error(err);
	});

	opts.db.knex('comments').update({
	  user_id: 0
	}).where({
	  user_id: model.previous('id')
	}).asCallback(function(err) {
	  if (err) opts.log.error(err);
	});

	opts.db.knex('hosts').update({
	  user_id: 0
	}).where({
	  user_id: model.previous('id')
	}).asCallback(function(err) {
	  if (err) opts.log.error(err);
	});
      });
    },

    checkPassword: function (password, cb) {
      bcrypt.compare(password, this.attributes.password, function (err, same) {
	cb(!err && same);
      });
    },

    acceptInvite: function(data, cb) {
      var self = this;
      bcrypt.hash(data.password, 8, function(err, hash) {
	self.set({
	  password: hash,
	  name: data.name,
	  username: data.username
	}).save().asCallback(cb);
      });
    },

    resetPassword: function(password, cb) {
      var self = this;
      bcrypt.hash(password, 8, function (err, hash) {
	self.set('password', hash).save().asCallback(cb);
      });
    },

    watching: function() {
      return this.belongsToMany('Discussion');
    },

    subscriptions: function() {
      return opts.db.knex('subscriptions').select().where('subscriber_id', this.attributes.id);
    },

    listens: function() {
      return this.belongsToMany('Vitamin', 'listens').withPivot(['created_at']);
    },

    imports: function() {
      return this.belongsToMany('Vitamin', 'hosts');
    },

    artists: function() {
      return this.belongsToMany('Artist', 'subscriptions', 'subscriber_id', 'prescriber_id').query('where', 'prescriber_type', 'artists');
    },

    groups: function() {
      return this.belongsToMany('Group', 'subscriptions', 'subscriber_id', 'prescriber_id').query('where', 'prescriber_type', 'groups');
    },

    users: function() {
      return this.belongsToMany('User', 'subscriptions', 'subscriber_id', 'prescriber_id').query('where', 'prescriber_type', 'users');
    },

    pages: function() {
      return this.belongsToMany('Page', 'subscriptions', 'subscriber_id', 'prescriber_id').query('where', 'prescriber_type', 'pages');
    },

    prescriptions: function () {
      return this.hasMany('Prescription', 'prescriber_id');
    },

    recommendations: function() {
      return this.belongsToMany('Prescription', 'votes', 'user_id', 'voteable_id').query(function(qb) {
	qb.where('votes.voteable_type', 'prescriptions');
      });
    },

    recommended: function() {
      return this.hasMany('Prescription', 'prescriber_id').query(function(qb) {
	qb.select(opts.db.knex.raw('*, count(votes.voteable_id) as count'));
	qb.leftJoin('votes', 'prescriptions.id', 'votes.voteable_id');
	qb.where('voteable_type', 'prescriptions');
	qb.having('count','>', 1);
	qb.groupBy('votes.voteable_id').orderBy('count', 'desc');
      });
    },

    crate: function() {
      return this.belongsToMany('Vitamin', 'crates', 'user_id', 'vitamin_id').withPivot(['created_at']);
    },

    tags: function() {
      return this.hasMany('Tag').query(function(qb) {
	qb.select('value', 'user_id').groupBy('tags.value');
      });
    },

    prescriptionCount: function() {
      return this.hasMany('Prescription', 'prescriber_id').query(function(qb) {
	qb.select('prescriptions.prescriber_id').whereNotNull('prescriptions.published_at').count('* as count').groupBy('prescriptions.prescriber_id');
      });
    },

    recommendationCount: function() {
      return this.belongsToMany('Prescription', 'votes', 'user_id', 'voteable_id').query(function(qb) {
	qb.where('votes.voteable_type', 'prescriptions').count('* as count').groupBy('votes.user_id');
      });
    },

    crateCount: function() {
      return this.belongsToMany('Vitamin', 'crates', 'user_id', 'vitamin_id').query(function(qb) {
	qb.count('* as count').groupBy('crates.user_id');
      });
    },

    tagCount: function() {
      return this.hasMany('Tag', 'user_id').query(function(qb) {
	qb.select(opts.db.knex.raw('COUNT(distinct tags.value) as count, tags.user_id'));
      });
    },

    listenCount: function() {
      return this.belongsToMany('Vitamin', 'listens', 'user_id', 'vitamin_id').query(function(qb) {
	qb.count('* as count').groupBy('listens.user_id');
      });
    },

    importCount: function() {
      return this.belongsToMany('Vitamin', 'hosts', 'user_id', 'vitamin_id').query(function(qb) {
	qb.count('* as count').groupBy('hosts.user_id');
      });

    },

    draftCount: function() {
      return this.hasMany('Prescription', 'prescriber_id').query(function(qb) {
	qb.select('prescriptions.prescriber_id').count('* as count').groupBy('prescriptions.prescriber_id').whereNull('prescriptions.published_at');
      });
    },

    pageCount: function() {
      return this.belongsToMany('Page', 'subscriptions', 'subscriber_id', 'prescriber_id').query(function(qb) {
	qb.count('* as count').groupBy('subscriptions.subscriber_id').where('prescriber_type', 'pages');
      });

    },

    userCount: function() {
      return this.belongsToMany('User', 'subscriptions', 'subscriber_id', 'prescriber_id').query(function(qb) {
	qb.count('* as count').groupBy('subscriptions.subscriber_id').where('prescriber_type', 'users');
      });
    }
  }, {

    findOrCreate: function(data, cb) {
      User.findOne({
	email: data.email
      }).asCallback(function(err, user) {
	if (err) {
	  cb(err, null);
	} else if (user) {
	  cb(null, user);
	} else {
	  User.create(data, cb);
	}
      });
    },

    create: function (data, done) {
      User.findOne({
	email: data.email
      }).asCallback(function (err, user) {
	if (user) {
	  done('Email exists', null);
	  return;
	}

	if (data.username) {

	  User.findOne({
	    username: data.username
	  }).asCallback(function (err, user) {
	    if (user) {
	      done('Username exists', null);
	      return;
	    }

	    bcrypt.hash(data.password, 8, function (err, hash) {
	      new User({
		name: data.name,
		email: data.email,
		username: data.username.toLowerCase(),
		password: hash
	      }).save().asCallback(function (err, user) {
		done(err, user);
	      });
	    });
	  });

	} else {
	  var increment = '(SELECT * FROM (SELECT MAX(id) FROM users) as tmptable)';
	  var expr = opts.db.knex.raw('concat("user",' + increment + ' + 1)');
	  new User({
	    name: expr,
	    email: data.email,
	    username: expr
	  }).save().asCallback(function (err, user) {
	    done(err, user);
	  });
	}
      });
    }

  });

  opts.db.model('User', User);

};
