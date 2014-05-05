var fs = require( 'fs' );
var Flow = require( 'node.flow' );
var request = require( './request' );
var multipart = require( './multipart' );

var config = {};

var resource_fixtures = null;
var load_resource_fixtures = function (){
  var fixtures = {};
  var cwd = process.cwd();

  var resource_fixtures_path = config.resource_fixtures_path + '/';

  var files = fs.readdirSync( resource_fixtures_path );
  files.forEach( function ( file ){
    if( !file.match( /\.js$/ )) return;

    var path = cwd + '/' + resource_fixtures_path + file;
    var fixture = require( path );
    for( var key in fixture ){
      var body = fixture[ key ];

      fixtures[ key ] = body;
    }
  });

  resource_fixtures = fixtures;
};

var TaskRunners = {
  'request' : function( task, ctx, options, cb ){
    if( !options ) options = {};

    var args = {};
    var resource = resource_fixtures[ task.path ];
    if( resource && resource[ task.method ]){
     args = resource[ task.method ];
    }

    if( typeof args === 'function' ) args = args( ctx );

    args.url = task.path;

    var tor = task.args.request;
    var data = args;
    var key;
    if( tor ){
      data = tor( args, ctx );
      for( key in data){
        args[ key ] = data[ key ];
      }
    }

    if( args.multipart ){
      var mp = args.multipart;
      mp.push.apply( mp, multipart( args.form ));
      delete args.form;
    }

    var params = data.params;
    if( params ){
      for( key in params ){
       args.url = args.url.replace(
          new RegExp( '(.*):' + key + '(\\/.*|$)' ),
          '$1' + params[ key ] + '$2');
      }
    }

    if( options.debug ){
      console.log( '=====' );
      console.log( 'request ' + task.method );
      console.log( args );
    }

    request[ task.method ]( args, function ( err, res, body ){
      var response_handler = task.args.response;
      var result;

      if( options.debug ){
        console.log( '-----' );
        console.log( 'status code: ' + res.statusCode );
        console.log( body );
      }

      if( response_handler ){
        result = response_handler( err, res, body );
        if( args.save_to ) ctx[ args.save_to ] = result;
      }else{
        try{
          result = JSON.parse( body );
          if( args.save_to ) ctx[ args.save_to ] = result;
        }catch(e){
        }
      }

      cb();
    });
  },

  'exec' : function( task, ctx, options, cb ){
    task.handler( ctx, cb );
  }
};

var Vodka = function( ctx, options ){
  this.ctx = ctx || {};
  this.queue = [];
  this.options = options || {};
};

[
  'get',
  'post',
  'put',
  'del'
].forEach( function ( method ){
  Vodka.prototype[ method ] = function( path, options ){
    options = options ? options : {};
    this.queue.push({
      type    : 'request',
      method  : method,
      path    : path,
      args    : options
    });

    return this;
  };
});

Vodka.prototype.exec = function( handler ){
  this.queue.push({
    type    : 'exec',
    handler : handler
  });

  return this;
};

Vodka.prototype.run = function( done ){
  var self = this;
  var flow = new Flow();

  this.queue.forEach( function ( task ){
    flow.series( function( next ){
      TaskRunners[ task.type ]( task, self.ctx, self.options, next );
    });
  });

  flow.end( function(){
    done();
  });
};

Vodka.config = function( _config ){
  for( var key in _config ){
    config[ key ] = _config[ key ];
  }

  return Vodka;
};

Vodka.init = function(){
  load_resource_fixtures();
  request.set_host( config.host );
};

module.exports = Vodka;
