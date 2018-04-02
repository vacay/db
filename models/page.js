/* global module, require */

var parse	= require('parse')
var request	= require('requestretry')
var async	= require('async')
var URI		= require('urijs')
var domain	= require('domain')
var cheerio	= require('cheerio')

function isURL (text) {
  var pattern = '^(https?:\\/\\/)?' + // protocol
	'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
	'((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
	'(?::\\d{2,5})?' + // port
	'(?:/[^\\s]*)?$'; // path

  var re = new RegExp(pattern, 'i');
  return re.test(text);
}

var getResources = function (data, url) {
  var resources = [],
      resourceText = data.toString('utf8')

  // Regular expressions for finding URL items in HTML and text
  var discoverRegex = [
      /(\shref\s?=\s?|\ssrc\s?=\s?|url\()([^\"\'\s>\)]+)/ig,
      /(\shref\s?=\s?|\ssrc\s?=\s?|url\()['"]([^"'<]+)/ig,
      /http(s)?\:(\/\/)[^?\s><\'\"\\]+/ig,
      /http(s)?\:(\\\/\\\/)[^?\s><\'\"]+/ig,
      /url\([^\)]+/ig,

      /^javascript\:[a-z0-9]+\(['"][^'"\s]+/ig
  ];
  function cleanURL(URL) {
    return URL
      .replace(/^(\s?href|\s?src)=['"]?/i, '')
      .replace(/^\s*/, '')
      .replace(/^url\(['"]*/i, '')
      .replace(/^javascript\:[a-z0-9]+\(['"]/i, '')
      .replace(/["'\)]$/i, '')
      .replace(/\\\/\\\//i, '//')
      .replace(/\\/gi, '')
      .split(/\s+/g)
      .shift()
      .replace('#038;', '&')
      .split('#')
      .shift();
  }

  function protocolSupported(URL) {
    var protocol, allowedProtocols = [
	/^http(s)?$/i // HTTP & HTTPS
    ];

    try {
      protocol = URI(URL).protocol();

      // Unspecified protocol. Assume http
      if (!protocol)
	protocol = 'http';

    } catch (e) {
      // If URIjs died, we definitely /do not/ support the protocol.
      return false;
    }

    return allowedProtocols.reduce(function (prev, protocolCheck) {
      return prev || !! protocolCheck.exec(protocol);
    }, false);
  }

  // Clean links
  function cleanAndQueue(urlMatch) {
    if (!urlMatch) return [];

    return urlMatch
      .map(cleanURL)
      .reduce(function (list, URL) {

	var uri, ext, allowedExts = [
	  'mp3',
	  'wav',
	  'mp4',
	  'm4a'
	];

	// Ensure URL is whole and complete
	try {
	  uri = URI(URL)
	    .absoluteTo(url)
	    .normalize();
	  ext = uri.suffix();
	  URL = uri.toString();
	} catch (e) {
	  // But if URI.js couldn't parse it - nobody can!
	  return list;
	}

	// does it pass our regex url test?
	if (!isURL(URL)) return list;

	// If we hit an empty item, don't add return it
	if (!URL.length) return list;

	// If we don't support the protocol in question
	if (!protocolSupported(URL)) return list;

	if (ext && allowedExts.indexOf(ext) === -1) return list;

	// Does the item already exist in the list?
	if (resources.reduce(function (prev, current) {
	  return prev || current === URL;
	}, false))
	  return list;

	return list.concat(URL);
      }, []);
  }

  // Rough scan for URLs
  return discoverRegex
    .reduce(function (list, regex) {
      return list.concat(
	cleanAndQueue(
	  resourceText.match(regex)));
    }, []);
};

var dedup = function (arr) {
  var i = 0,
      l = arr.length,
      out = [],
      obj = {};

  for (; i < l; i++) {
    obj[arr[i]] = 0;
  }
  for (i in obj) {
    if (obj.hasOwnProperty(i)) out.push(i);
  }
  return out;
};

var getHtml = function(url, callback) {
  var d = domain.create();
  var limit = 1000 * 1000 * 10;
  var size = 0;

  d.on('error', function(err) {
    callback(err);
  });

  d.run(function() {
    var r = request({
      method: 'GET',
      url: url,
      rejectUnauthorized: false,
      headers: {
	'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.110 Safari/537.36'
      }
    }, function() {
      // node request needs a callback to emit a 'complete' event with the body
    });

    r.on('data', function(chunk) {
      size += chunk.length;
      if (size > limit) {
	r.abort();
	callback('page: ' + url + ' is too large, nice try brian', null);
      }
    });

    r.on('error', function(err) {
      r.abort();
      callback(err, null);
    });

    r.on('complete', function(response, body) {
      callback(body ? null : 'page: ' + url + ' has no body', body);
    });
  });
};

module.exports = function(opts) {

  var Page = opts.db.Model.extend({

    tableName: 'pages',

    vitamins: function () {
      return this.belongsToMany('Vitamin').withPivot(['created_at']);
    },

    subscribers: function() {
      return this.belongsToMany('User', 'subscriptions', 'prescriber_id', 'subscriber_id').query('where', 'prescriber_type', 'groups');
    },

    groups: function() {
      return this.belongsToMany('Group');
    },

    vitaminCount: function() {
      return this.belongsToMany('Vitamin').query(function(qb) {
	qb.count('* as count');
      });
    }

  }, {

    findOrCreate: function(url, cb) {
      var Page = opts.db.model('Page');
      var Vitamin = opts.db.model('Vitamin');

      Page.forge({url: url}).fetch().asCallback(function(err, page) {

	if (page && page.attributes.is_static) {
	  cb(null, page);
	  return;
	}

	var title, isStatic;

	var tracks = [];
	var links = [];
	var paths = [];
	var feeds = [];

	async.waterfall([

	  // check if the url itself represents music
	  function(callback) {
	    parse(url, function(err, results) {
	      if (err) {
		callback(err);
		return;
	      }
	      tracks = results;
	      callback();
	    });
	  },

	  // check the links in the html for music
	  function(callback) {

	    if (tracks.length) {
	      isStatic = true;
	      callback();
	      return;
	    }

	    getHtml(url, function(err, body) {
	      if (err) {
		callback(err);
		return;
	      }

	      var isXML = body.slice(1, 5) === '?xml';
	      var $ = cheerio.load(body, {
		xmlMode: isXML ? true : false
	      });

	      title = $('title').first().text();

	      if (!isXML) {

		var extract = function() {
		  var feed = $(this).attr('href');
		  try {
		    var uri = URI(feed).absoluteTo(url).normalize();
		    if (feeds.indexOf(uri.toString()) < 0)
		      feeds.push(uri.toString());
		  } catch(e) {
		    opts.log.error(e);
		  }
		};

		// Legit
		$('link[type*=rss]').each(extract);
		$('link[type*=atom]').each(extract);

		// Questionable
		$('a:contains(RSS)').each(extract);
		$('a[href*=feedburner]').each(extract);

	      } else {
		// get entry/item links and add to path
		$('feed entry link').each(function() {
		  var path = $(this).attr('href');
		  // validate domain
		  paths.push(URI(path).search('').fragment('').toString());
		});

		$('channel item link').each(function() {
		  var path = $(this).text();
		  // validate domain
		  paths.push(URI(path).search('').fragment('').toString());
		});
	      }

	      links = links.concat(dedup(getResources(body, url)));
	      isStatic = false;
	      callback();
	    });
	  },

	  // get links from feed entries
	  function(callback) {
	    var parsePaths = function(path, done) {
	      parse(path, function(err, results) {
		if (err) opts.log.error(err);

		if (results.length) {
		  tracks = tracks.concat(results);
		} else {
		  getHtml(path, function(err, body) {
		    if (err) {
		      opts.log.error(err);
		      done();
		      return;
		    }

		    links = links.concat(dedup(getResources(body, path)));
		    done();
		  });
		}
	      });
	    };

	    paths = dedup(paths).slice(0, 25);

	    async.each(paths, parsePaths, callback);
	  },

	  function(callback) {
	    if (!page) {
	      Page.create({
		title: title || url,
		url: url,
		is_static: isStatic
	      }).asCallback(callback);
	    } else {
	      Page.edit({
		id: page.id,
		updated_at: new Date()
	      }).asCallback(callback);
	    }
	  },

	  function(page, callback) {

	    if (tracks.length) {
	      callback(null, page);
	      return;
	    }

	    links = dedup(links);

	    async.each(links, function(link, next) {
	      parse(link, function(err, results) {
		if (err) opts.log.error(err, { link: link, page: page });
		else tracks = tracks.concat(results);
		next();
	      });
	    }, function(err) {
	      callback(err, page);
	    });
	  },

	  function(page, callback) {

	    var vitaminIds = [0];

	    async.eachSeries(tracks, function(item, next) {
	      Vitamin.findOrCreate(item, function(err, vitamin) {
		if (err) {
		  next(err);
		  return;
		}
		vitaminIds.push(vitamin.id);
		vitamin.related('pages').attach({page_id: page.id, created_at: new Date(), on_page: true}).asCallback(function(err) {
		  // silence ER_DUP_ENTRY
		  if (err && err.errno === 1062) {
		    next();
		    return;
		  }
		  next(err);
		});
	      });
	    }, function(err) {
	      callback(err, page, vitaminIds);
	    });

	  },

	  function(page, vitaminIds, callback) {
	    page.related('vitamins').updatePivot({
	      on_page: true
	    }, {
	      query: {
		whereIn: ['vitamin_id', vitaminIds]
	      }
	    }).asCallback(function(err) {
	      callback(err, page, vitaminIds);
	    });
	  },

	  function(page, vitaminIds, callback) {

	    page.set({feeds: feeds});

	    page.related('vitamins').updatePivot({
	      on_page: false
	    }, {
	      query: {
		whereNotIn: ['vitamin_id', vitaminIds]
	      }
	    }).asCallback(function(err) {
	      callback(err, page);
	    });

	  }

	], function(err, page) {
	  cb(err, page);
	});
      });
    }
  });

  opts.db.model('Page', Page);
};
