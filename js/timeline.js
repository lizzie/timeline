define(function(require, exports, module) {

    var $ = require('$'),
        Mustache = require('mustache'),
        Base = require('base');

    var TimeLine = Base.extend({
        attrs: {
            data: {
                value: 'default',
                getter: function(v) {
                    //console.log(['getter', v]);
                    return v;
                },
                setter: function(v) {
                    //console.log(['setter', v]);
                    return v;
                }
            }
        },
        initialize: function() {
            My.superclass.initialize.apply(this, arguments);
            this.memberMy = 'my';
        },
        destory: function() {

        },
        say: function() {
            console.log([this, this.memberMy, this.get('data')])
        }
    });

    return TimeLine;

});