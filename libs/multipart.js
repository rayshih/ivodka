/**
 * multipart
 *
 * Transform json to http POST body
 *
 * @param body {Object} json object
 * @return
 */
module.exports = function ( body ){
  var result = [];
  var travel = function ( obj, ns ){
    Object.keys( obj ).forEach( function ( key ){
      var tmp  = obj[ key ];
      var type = UTILS.is( tmp );
      var name = ns !== undefined ?
        ns + '[' + key + ']' :
        key;

      if( type === 'object' ){
        travel( tmp, name );
      }else{
        result.push({
          'content-disposition' : 'form-data; name="' + name + '";',
          body                  : tmp.toString()
        });
      }
    });
  };

  travel( body );

  return result;
};
