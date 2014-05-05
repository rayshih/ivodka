var request = require( 'request' );
var multipart = require( './multipart' );

var host = null;
var my_request = {};

[
  'get',
  'post',
  'put',
  'del'
].forEach(function ( method ) {
  my_request[ method ] = function(){
    var args = arguments;
    var first_arg = args[ 0 ];

    if( typeof first_arg == 'object' ){
      first_arg.url = host + first_arg.url;
    }else{
      first_arg = host + first_arg;
    }

    if( first_arg.multipart && first_arg.form ){
      var mp = first_arg.multipart;
      mp.push.apply( mp, multipart( first_arg.form ));
      delete first_arg.form;
    }

    return request[ method ].apply( request, args );
  };
});

my_request.set_host = function( h ){
  host = h;
};

module.exports = my_request;
