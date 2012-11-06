seajs.config({
    alias: {
        '$': 'http://modules.seajs.org/jquery/1.7.2/jquery.js',
        'base': 'http://modules.seajs.org/base/0.9.16/base.js',
        'mustache': 'http://modules.seajs.org/mustache/0.5.0/mustache.js'
    }
});
seajs.use(['./timeline'], function(TL) {
    //new TL()
});