define(function(require, exports, module) {

    var $ = require("$"),
        Mustache = require("mustache"),
        _ = require("underscore"),
        Base = require("base"),

        DIMENSION = {
            "Year": "年",
            "Month": "月"
        },

        log = function() {
            console && console.log.apply(console, arguments);
        };

    var TimeLine = Base.extend({
        attrs: {
            /**
             * TimeLine Container
             * Selector
             */
            container: {
                value: "",
                setter: function(v) {
                    if (_.isString(v)) return $(v).first();
                    return v;
                }
            },
            dataUrl: {
                value: "./data"
            },
            /**
             *
             */
            orderBy: {
                value: "Year",
                setter: function(v) {
                    if (_.has(DIMENSION, v)) return v;
                    log("not support "+v);
                    return "Year";
                }
            },
            /**
             * String
             */
            template: {
                value: "",
                setter: function(v) {
                    return $(v).html();
                }
            },

            actions: {
                value: {
                    doComment: function(target) {
                        var self = this;
                    },
                    doLike: function(target) {
                    }
                }
            },

            // 以下是私有变量
            rawData: {
                value: {}
            },
            model: {
                value: {
                    loading: true
                }
            },
            loading: {
                value: true
            }
        },
        initialize: function() {
            TimeLine.superclass.initialize.apply(this, arguments);

            var self = this;

            // 初始先render一次
            self.render();

            self.on("change:loading", function(newVal, oldVal) {
                self.get("container")[newVal?"addClass":"removeClass"]("loading");
            });
            self.request();
            self.bind();
        },
        byYear: function(data) {
            return _.groupBy(data.unit, function(d){ return d.datetime.getFullYear(); });
        },
        byMonth: function(data) {
            return _.groupBy(data.unit, function(d){ return d.datetime.getMonth(); });
        },
        // 请求数据
        request: function() {
            var self = this;

            self.set('loading', true);
            require.async(self.get("dataUrl"), function(data) {
                _.delay(function() {
                    self.set("rowData", data);
                    self.render(data);
                    self.set('loading', false);
                }, 3000);
            });
        },
        process: function(data) {
            var self = this, d = [];

            _.each(self["by"+self.get("orderBy")](data), function(v, k) {
                d.push({
                    "key": k,
                    "keyUnit": DIMENSION[self.get("orderBy")],
                    "unit": v
                });
            });
            self.set("model", {"data": d});

        },

        // 渲染到页面
        render: function(data) {
            var self = this,
                html = "";

            data && self.process(data);

            html = Mustache.render(self.get("template"), self.get("model"));

            self.get("container").html(html);
        },
        bind: function() {
            var self = this;

            self.get("container").click(function(e) {
                e.preventDefault();
                var el = $(e.target),
                    actions = el.attr("data-action"),
                    actionsList = self.get("actions");

                if (_.has(actionsList, actions)) {
                    actionsList[actions].call(self, e.target);
                }
            });
        },
        destory: function() {

        }
    });

    return TimeLine;

});