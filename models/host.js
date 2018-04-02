/* global module */
var parse = require('parse')

module.exports = function(opts) {

  var Host = opts.db.Model.extend({
    tableName: 'hosts',

    vitamin: function () {
      return this.belongsTo('Vitamin');
    }
  }, {
    parse: parse
  });

  opts.db.model('Host', Host);
};
