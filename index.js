var iVodka = require( './libs/core' );
iVodka.request = require( './libs/request' );

// default config
iVodka.config({
  host: 'http://localhost:4000',
  resource_fixtures_path: 'test/fixtures/resources'
});

module.exports = iVodka;
