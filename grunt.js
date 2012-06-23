module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-closure-compiler');

  // Project configuration.
  grunt.initConfig({
    'closure-compiler': {

      BlockBuilder_debug: {
        js: [
          'src/exports/exports.js',
          'src/BlockBuilder.js'
        ],
        jsOutputFile: 'build/blockbuilder.debug.js',
        options: {
          compilation_level: 'ADVANCED_OPTIMIZATIONS',
          language_in: 'ECMASCRIPT5_STRICT',
          summary_detail_level: 3,
          warning_level: 'VERBOSE',
          debug: true,
          formatting: 'PRETTY_PRINT'
        }
      },
      MemoryDumper_debug: {
        js: [
          'src/exports/exports.js',
          'src/externs/externs.js',
          'src/MemoryDumper.js'
        ],
        jsOutputFile: 'build/memorydumper.debug.js',
        options: {
          compilation_level: 'ADVANCED_OPTIMIZATIONS',
          language_in: 'ECMASCRIPT5_STRICT',
          summary_detail_level: 3,
          warning_level: 'VERBOSE',
          debug: true,
          formatting: 'PRETTY_PRINT'
        }
      },

      MemoryDumper_prod: {
        js: '<config:closure-compiler.MemoryDumper_debug.js>',
        jsOutputFile: 'build/memorydumper.min.js',
        options: {
          compilation_level: 'ADVANCED_OPTIMIZATIONS',
          language_in: 'ECMASCRIPT5_STRICT',
          summary_detail_level: 3,
          warning_level: 'VERBOSE',
          debug: false
        }
      }

    }
  });

  // Default task.
  grunt.registerTask('default', 'closure-compiler');

};
