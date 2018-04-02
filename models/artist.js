/* global require, module */

var request	= require('requestretry')
var URI		= require('urijs')

module.exports = function(opts) {

  var Artist = opts.db.Model.extend({

    tableName: 'artists',

    hidden: [
      'bio',
      'bio_url',
      'spotify',
      'rdio',
      'twitter',
      'facebook',
      'wikipedia',
      'lastfm',
      'website',
      'musicbrainz',
      'discogs',
      'deezer',
      'songkick',
      'seatwave',
      'rhapsody',
      'eventful',
      'whosampled',
      'seatgeek',
      'jambase',
      'sevendigital',
      'myspace'
    ],

    vitaminCount: function() {
      return this.belongsToMany('Vitamin').query(function(qb) {
	qb.where('attributed', true);
	qb.count('* as count').groupBy('artists_vitamins.artist_id');
      });
    },

    vitamins: function() {
      return this.belongsToMany('Vitamin').query({
	where: {
	  attributed: true
	}
      });
    },

    originalCount: function() {
      return this.belongsToMany('Vitamin').query(function(qb) {
	qb.where({
	  attributed: true,
	  type: 'Original'
	});
	qb.count('* as count').groupBy('artists_vitamins.artist_id');
      });
    },

    originals: function() {
      return this.belongsToMany('Vitamin').query({
	where: {
	  attributed: true,
	  type: 'Original'
	}
      });
    },

    variationCount: function() {
      return this.belongsToMany('Vitamin').query(function(qb) {
	qb.where({
	  attributed: true,
	  type: 'Variation'
	});
	qb.count('* as count').groupBy('artists_vitamins.artist_id');
      });
    },

    variations: function() {
      return this.belongsToMany('Vitamin').query({
	where: {
	  attributed: true,
	  type: 'Variation'
	}
      });
    },

    subscribers: function() {
      return this.belongsToMany('User', 'subscriptions', 'prescriber_id', 'subscriber_id').query('where', 'prescriber_type', 'artists');
    }

  }, {

    findOrCreate: function(data, cb) {
      var Artist = opts.db.model('Artist');

      Artist.forge({
	echonest: data.echonest
      }).fetch().asCallback(function(err, artist) {

	if (err) {
	  cb(err, null);
	  return;
	}

	if (artist) {
	  cb(null, artist);
	  return;
	}

	var qs = [
	  'api_key=' + opts.config.echonest_key,
	  'id=' + data.echonest,
	  'bucket=biographies',
	  'bucket=urls',
	  'bucket=artist_location',
	  'bucket=images',
	  'bucket=years_active',
	  'bucket=id:7digital-US',
	  'bucket=id:deezer',
	  'bucket=id:discogs',
	  'bucket=id:eventful',
	  'bucket=id:facebook',
	  'bucket=id:fma',
	  'bucket=id:jambase',
	  'bucket=id:musicbrainz',
	  'bucket=id:playme',
	  'bucket=id:rhapsody-US',
	  'bucket=id:rdio-US',
	  'bucket=id:seatgeek',
	  'bucket=id:seatwave',
	  'bucket=id:songkick',
	  'bucket=id:spotify',
	  'bucket=id:twitter',
	  'bucket=id:whosampled'
	].join('&');

	request({
	  url: 'http://developer.echonest.com/api/v4/artist/profile?' + qs,
	  json: true,
	  maxAttempts: 3,
	  rejectUnauthorized: false
	}, function(err, res, body) {

	  if (err) {
	    cb(err, null);
	    return;
	  }

	  if (!body.response || !body.response.artist) {
	    cb('response missing', null);
	    return;
	  }

	  var echonest = body.response.artist;

	  // set up foreign ids
	  var foreign_ids = {};
	  if (echonest.foreign_ids) {
	    for (var i = 0; i<echonest.foreign_ids.length; i++) {
	      foreign_ids[echonest.foreign_ids[i].catalog] = echonest.foreign_ids[i].foreign_id.split(':').pop();
	    }
	  }

	  // get musicbrainz id from url
	  var uri = new URI(echonest.urls.mb_url);
	  var filename = uri.filename();
	  var mbid = filename ? filename.slice(0, -5) : null;

	  // order bio by priority: wikipedia, last.fm, facebook
	  var bio, count = 1;
	  var find = function(type) {
	    for (var b=0; b<echonest.biographies.length; b++) {
	      if (type ? (echonest.biographies[b].site === type) : true) {
		bio = echonest.biographies[b];
		return;
	      }
	    }
	  };

	  while (!bio && count <= 4) {
	    switch(count) {
	    case 1:
	      find('wikipedia');
	      break;
	    case 2:
	      find('last.fm');
	      break;
	    case 3:
	      find('facebook');
	      break;
	    default:
	      find();
	      break;
	    }

	    count++;

	  }

	  var years = echonest.years_active.length ? echonest.years_active[0] : {};
	  var location = echonest.artist_location;

	  var artist = {

	    bio: bio ? bio.text : null,
	    bio_url: bio ? bio.url : null,
	    start_year: years.start,
	    end_year: years.end,
	    name: echonest.name,

	    artist_city: location ? location.city : null,
	    artist_region: location ? location.region : null,
	    artist_location: location ? location.location : null,
	    artist_country: location ? location.country : null,

	    website: echonest.urls.official_url,
	    lastfm: echonest.urls.lastfm_url,
	    myspace: echonest.urls.myspace_url,
	    wikipedia: echonest.urls.wikipedia_url,
	    musicbrainz: foreign_ids.musicbrainz || mbid,
	    twitter: foreign_ids.twitter || echonest.urls.twitter_url,
	    facebook: foreign_ids.facebook,
	    songkick: foreign_ids.songkick,
	    discogs: foreign_ids.discogs,
	    sevendigital: foreign_ids['7digital-US'],
	    rdio: foreign_ids['rdio-US'],
	    whosampled: foreign_ids.whosampled,
	    seatgeek: foreign_ids.seatgeek,
	    jambase: foreign_ids.jambase,
	    eventful: foreign_ids.eventful,
	    deezer: foreign_ids.deezer,
	    seatwave: foreign_ids.seatwave,
	    rhapsody: foreign_ids['rhapsody-US'],
	    spotify: foreign_ids.spotify,
	    echonest: echonest.id
	  };

	  Artist.create(artist).asCallback(cb);

	});
      });
    }
  });

  opts.db.model('Artist', Artist);

};
