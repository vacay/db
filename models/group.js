/* global module */

module.exports = function(opts) {

  var Group = opts.db.Model.extend({
    tableName: 'groups',

    subscribers: function() {
      return this.belongsToMany('User', 'subscriptions', 'prescriber_id', 'subscriber_id').query('where', 'prescriber_type', 'groups');
    },

    admins: function() {
      return this.belongsToMany('User', 'groups_users').query('where', 'access', 'admin');
    },

    prescriptions: function() {
      return this.belongsToMany('Prescription', 'prescriptions_groups').query('whereNotNull', 'prescriptions.published_at');
    },

    pages: function() {
      return this.belongsToMany('Page');
    },

    pageCount: function() {
      return this.belongsToMany('Page').query(function(qb) {
	qb.count('* as count');
      });
    },

    prescriptionCount: function() {
      return this.belongsToMany('Prescription', 'prescriptions_groups').query(function(qb) {
	qb.whereNotNull('prescriptions.published_at').count('* as count');
      });
    }
  });

  opts.db.model('Group', Group);

};
