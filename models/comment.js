/* global require, module */

var async = require('async')

module.exports = function(opts) {

  var Comment = opts.db.Model.extend({
    tableName: 'comments',

    constructor: function() {
      opts.db.Model.apply(this, arguments);
      this.on('created', function(model) {
	async.parallel({
	  discussion: function(cb) {
	    model.discussion().fetch().asCallback(cb);
	  },
	  user: function(cb) {
	    model.user().fetch().asCallback(cb);
	  }
	}, function(err, results) {
	  if (err) opts.log.error(err);

	  var watchers = results.discussion.watchers();

	  watchers.attach(model.attributes.user_id);

	  watchers.fetch().asCallback(function(err, users) {
	    if (err) opts.log.error(err);

	    var emails = users.pluck('email');
	    var index = emails.indexOf(results.user.attributes.email);
	    if (index !== -1) {
	      emails.splice(index, 1);
	    }

	    var body = model.attributes.body;

	    var link = {
	      target: '/discussion/' + results.discussion.id,
	      text: 'view discussion'
	    };

	    var subject = '[comment from @' + results.user.attributes.username + '] - ' + results.discussion.attributes.title;

	    if (emails.length) {
	      opts.sendEmail({
		emails: emails,
		subject: subject,
		body: body,
		link: link
	      }, function(err) {
		if (err) opts.log.error(err)
	      })
	    }
	  });
	});
      });
    },

    user: function() {
      return this.belongsTo('User');
    },

    discussion: function() {
      return this.belongsTo('Discussion');
    },

    votes: function() {
      return this.morphMany('Vote', 'voteable');
    }
  });

  opts.db.model('Comment', Comment);
};
