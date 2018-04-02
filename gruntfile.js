/* global module */

module.exports = function (grunt) {

    grunt.initConfig({
	pkg: grunt.file.readJSON('package.json'),
	jshint: {
	    options: {
		curly: false,
		undef: true,
		unused: true,
		bitwise: true,
		freeze: true,
		smarttabs: true,
		immed: true,
		latedef: true,
		newcap: true,
		noempty: true,
		nonew: true,
		trailing: true,
		forin: true,
		eqeqeq: true,
		eqnull: true,
		force: true,
		quotmark: 'single',
		expr: true
	    },
	    main: [
		'index.js',
		'gruntfile.js',
		'models/**/*.js'
	    ]
	}
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('default', ['jshint']);

};
