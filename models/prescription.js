/* global module, require */

var async		= require('async')
var elasticsearch	= require('elasticsearch')
var jwt			= require('jsonwebtoken')

module.exports = function (opts) {

  var es = new elasticsearch.Client({
    hosts: opts.config.elasticsearch.hosts
  });

  var Prescription = opts.db.Model.extend({

    tableName: 'prescriptions',

    constructor: function() {
      opts.db.Model.apply(this, arguments);

      this.on('saved', function(model) {

	if (model.attributes.published_at) {

	  async.parallel({

	    prescriber: function(cb) {
	      opts.db.knex('users')
		.select()
		.innerJoin('prescriptions', 'users.id', 'prescriptions.prescriber_id')
		.where('prescriptions.id', model.id)
		.asCallback(cb);
	    },

	    users: function(cb) {
	      model.related('users').fetch().asCallback(cb);
	    }

	  }, function(err, results) {

	    if (err) {

	      opts.log.error(err);

	    } else {

	      var notification = {
		emails: [],
		subject: '[@' + results.prescriber[0].username  + ' sent you a prescription]',
		body: results.prescriber[0].description,
		link: {
		  target: '/prescription/' + model.id,
		  text: 'view prescription'
		}
	      };

	      var users = results.users.models;

	      for (var i=0; i<users.length; i++) {
		if (users[i].attributes.password) {
		  notification.emails.push(users[i].attributes.email);
		} else {
		  var token = jwt.sign({
		    email: users[i].attributes.email
		  }, opts.config.invite.secret, {
		    noTimestamp: true
		  });

		  var invite = {
		    emails: [users[i].attributes.email],
		    subject: '@' + results.prescriber[0].username + ' wants you to join vacay.io',
		    body: results.prescriber[0].name + ' has sent you a special prescription, a playlist of music to keep you healthy, and invited you to vacay.io.',
		    link: {
		      target: '/prescription/' + model.id + '?invite=' + token,
		      text: 'view prescription'
		    }
		  };

		  opts.sendEmail(invite, function(err) {
		    if (err) opts.log.error(err)
		  })
		}
	      }

	      if (notification.emails.length)
		opts.sendEmail(notification, function(err) { if (err) opts.log.error(err) })
	    }

	  });

	}
      });

      this.on('destroyed', function(model) {
	//TODO: if its not published, delete any uninvited users

	opts.db.knex('votes').where({
	  voteable_type: 'prescriptions',
	  voteable_id: model.previous('id')
	}).del().asCallback(function(err) {
	  if (err) opts.log.error(err);
	});

	es.delete({
	  index: 'vcy',
	  type: 'prescriptions',
	  id: model.previous('id')
	}, function(err) {
	  if (err) opts.log.error(err);
	});
      });
    },

    prescriber: function () {
      return this.belongsTo('User', 'prescriber_id');
    },

    vitamins: function () {
      return this.belongsToMany('Vitamin').query('orderBy', 'order', 'asc');
    },

    users: function() {
      return this.belongsToMany('User', 'prescriptions_users');
    },

    groups: function() {
      return this.belongsToMany('Group', 'prescriptions_groups');
    },

    votes: function() {
      return this.morphMany('Vote', 'voteable');
    }
  });

  opts.db.model('Prescription', Prescription);

};
