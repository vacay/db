/* global module */

module.exports = function(opts) {

  var Vote = opts.db.Model.extend({
    tableName: 'votes',

    user: function() {
      return this.belongsTo('User');
    },

    voteable: function() {
      return this.morphTo('voteable', 'Discussion', 'Comment');
    }

  });

  opts.db.model('Vote', Vote);

};
