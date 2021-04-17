module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      uglify: {
        options: {
          banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
        },
        build: {
          src: 'js/index.js',
          dest: 'build/index.min.js'
        }
      },
      // Web server
      connect: {
        server: {
          options: {
            port: 8000,
            hostname: '*',
            keepalive: true
          }
        }
      }
    });
  
    // Load the plugins
    grunt.loadNpmTasks('grunt-contrib-connect');
  
    // Default tasks
    //grunt.registerTask('default', ['serve', 'connect']);
};