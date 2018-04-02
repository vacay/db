/* global module */

module.exports = function(opts) {

  var Discussion = opts.db.Model.extend({
    tableName: 'discussions',

    constructor: function() {
      opts.db.Model.apply(this, arguments);
      this.on('created', function(model) {
	model.watchers().attach(model.attributes.user_id);

	var emails = ['kr@vacay.io'];
	var subject = '[new discussion] - ' + model.attributes.title;
	var body = model.attributes.description;
	var link = {
	  target: '/discussion/' + model.id,
	  text: 'view discussion'
	};

	opts.sendEmail({
	  emails: emails,
	  subject: subject,
	  body: body,
	  link: link
	}, function(err) {
	  if (err) opts.log.error(err)
	})
      });
    },

    user: function() {
      return this.belongsTo('User');
    },

    comments: function() {
      return this.hasMany('Comment');
    },

    votes: function() {
      return this.morphMany('Vote', 'voteable');
    },

    watchers: function() {
      return this.belongsToMany('User');
    }

  });

  opts.db.model('Discussion', Discussion);

};
