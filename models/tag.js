/* global module */
var async = require('async')

module.exports = function(opts) {

  var Tag = opts.db.Model.extend({
    tableName: 'tags',
    hasTimestamps: ['created_at'],

    constructor: function() {
      opts.db.Model.apply(this, arguments);

      this.on('created', function(model) {

	if (model.attributes.value.charAt(0) === '@') {
	  var username = model.attributes.value.substring(1);
	  opts.db.knex('users').select().where('username', username).asCallback(function(err, data) {
	    if (err) {
	      opts.log.error(err);
	      return;
	    }

	    if (!data.length) return;

	    var user = data[0];
	    if (!user.activity) return;

	    async.parallel({
	      vitamin: function(cb) {
		model.vitamin().fetch().asCallback(cb);
	      },
	      tagger: function(cb) {
		model.user().fetch().asCallback(cb);
	      }
	    }, function(err, results) {
	      if (err) {
		opts.log.error(err);
		return;
	      }

	      var vitamin = results.vitamin.toJSON();
	      var tagger = results.tagger.toJSON();

	      opts.sendEmail({
		emails: [user.email],
		subject: '[@' + tagger.username + ' tagged you]',
		body: tagger.name + ' tagged you on the following vtamin: ' + vitamin.title,
		link: {
		  target: '/vitamin/' + vitamin.id,
		  text: 'view vitamin'
		}
	      }, function(err) {
		if (err) opts.log.error(err)
	      })
	    });
	  });
	}
      });
    },

    user: function() {
      return this.belongsTo('User');
    },

    vitamin: function() {
      return this.belongsTo('Vitamin');
    }

  });

  opts.db.model('Tag', Tag);

};
