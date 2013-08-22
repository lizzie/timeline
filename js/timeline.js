define(function(require, exports, module) {

    var $ = require("$"),
        Handlebars = require("handlebars"),
        _ = require("underscore"),
        Base = require("base"),

        DIMENSION = {
            "year": "年",
            "month": "月"
        },
        SCROLL_OFFSET = 0,

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
            navContainer: {
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
                value: "year",
                setter: function(v) {
                    if (_.has(DIMENSION, v)) return v;
                    log("not support "+v);
                    return "year";
                }
            },
            /**
             * String
             */
            blockTemplate: {
                value: "",
                setter: function(v) {
                    return $(v).html();
                }
            },
            unitTemplate: {
                value: "",
                setter: function(v) {
                    return $(v).html();
                }
            },
            navTemplate: {
                value: "",
                setter: function(v) {
                    return $(v).html();
                }
            },
            navSelectedCls: {
                value: "selected"
            },

            actions: {
                value: {
                    doComment: function(target) {
                        var self = this;
                        log('comment');
                    },
                    doLike: function(target) {
                        log('like');
                    }
                }
            },
            column: {
                value: 2,
                setter: function(v) {
                    return _.max([_.min([2, v]), 1]);
                }
            },
            // todo
            loading: {
                value: true
            }
        },
        initialize: function() {
            TimeLine.superclass.initialize.apply(this, arguments);

            var self = this;

            self._unitData = [];
            self._blockData = {
                loading: true,
                year: {},
                month: {}
            };

            // first render once
            self._renderBlock();

            self.on("change:loading", function(newVal, oldVal) {
                self.get("container")[newVal?"addClass":"removeClass"]("loading");
            });
            self.request();
            self.bind();
        },
        _process: function(data) {
            var self = this,
                blockData = self._blockData,
                unitData = self._unitData,
                unitDataLength = unitData.length;
            _.each(data.unit, function(d, index) {
                var year = d.datetime.getFullYear()+"",
                    month = year + "-" + d.datetime.getMonth(),
                    keyIndex = index+unitDataLength;

                if (_.has(blockData["year"], year)) blockData["year"][year]["data"].push(keyIndex); else {
                    blockData["year"][year] = {};
                    blockData["year"][year]["year"] = year;
                    blockData["year"][year]["data"] = [keyIndex];
                }
                if (_.has(blockData["month"], month)) blockData["month"][month]["data"].push(keyIndex); else {
                    blockData["month"][month] = {};
                    blockData["month"][month]["year"] = year;
                    blockData["month"][month]["month"] = d.datetime.getMonth()+"";
                    blockData["month"][month]["data"] = [keyIndex];
                }
                // adjust image width/height according to container width
                var w, h, r, iW = self.get("imgWidth");
                if (iW < d.img_width) {
                    r = d.img_width/ d.img_height;
                    w = iW;
                    h = w/r;
                } else {
                    w = d.img_width;
                    h = d.img_height;
                }
                d._img_width = w;
                d._img_height = h;
                unitData.push(d);
            });
        },
        request: function() {
            var self = this;

            self.set('loading', true);
            require.async(self.get("dataUrl"), function(data) {
                _.delay(function() {
                    self._process(data);
                    self.render();
                    self.set('loading', false);
                }, 3000);
            });
        },
        _renderBlock: function() {
            var self = this,
                blockData = self._blockData[self.get("orderBy")],
                container = self.get("container"),
                ret = {
                    block: []
                };

            _.each(blockData, function(v, k) {
                v.key = v.year+DIMENSION["year"]+(v.month? v.month+DIMENSION["month"]:"");
                ret.block.push(v);
            });
            container.html(Handlebars.compile(self.get("blockTemplate"))(ret));

            // no data or when loading
            if (!ret.block.length) return;

            var navTpl = self.get("navTemplate"),
                navContainer = self.get("navContainer");
            if (navTpl && navContainer) {
                navContainer.html(Handlebars.compile(navTpl)(ret));
            }
        },
        _renderUnit: function() {
            var self = this,
                blockData = self._blockData[self.get("orderBy")],
                container = self.get("container");

            _.each(blockData, function(v, k) {
                var columnHeight = [],
                    blockContainer = container.find('#tl-header-'+ +(v.month || v.year)+" .tl-bd");

                for(var i=0; i<self.get("column");i++) {
                    columnHeight.push(0);
                }
                _.each(v.data, function(idx) {
                    var unit = self._unitData[idx],
                        which = -1,
                        el;

                    if (columnHeight.length>1) which = _.indexOf(columnHeight, _.min(columnHeight));
                    unit._column = which+1;
                    el = $(Handlebars.compile(self.get("unitTemplate"))(unit));
                    blockContainer.append(el);
                    if (columnHeight.length>1) {
                        columnHeight[which] += el.height();
                    }
                    unit._rendered = true;
                });
            });
        },

        // render to page
        render: function(data) {
            var self = this;

            self._renderBlock();
            self._renderUnit();
        },
        _scrolling: function() {
            var self = this,
                navContainer = self.get("navContainer"),
                st = $(window).scrollTop();

            // set select class navSelectedCls
            if (navContainer.length) {
                var which = null,
                    allHeader = navContainer.find('a'),
                    select_cls = self.get("navSelectedCls");

                _.each(allHeader, function(a) {
                    var w = $($(a).attr("href"));
                    if (w.length && w.offset().top-SCROLL_OFFSET<=st) which = $(a);
                });
                navContainer.children("li").removeClass(select_cls);
                which && which.parent("li").addClass(select_cls);
            }

            // todo loading
        },
        bind: function() {
            var self = this;

            // events
            self.get("container").delegate("*[data-action]", "click", function(e) {
                e.preventDefault();

                var el = $(e.currentTarget),
                    actions = el.attr("data-action"),
                    actionsList = self.get("actions");

                if (_.has(actionsList, actions)) {
                    actionsList[actions].call(self, e.target);
                }
            }).delegate(".tl-spine", "mousemove", function(e) {
                var el = $(e.currentTarget),
                    i = el.find("i");
                    i.css("top", e.pageY-el.offset().top);
            });

            // scroll loading & navigator
            $(window).scroll(_.throttle(function() { self._scrolling(); }, 200));

            self.get("navContainer").click(function(e) {
                e.preventDefault();
                var el = $(e.target),
                    to = el.attr("href");
                $("body, html").animate({scrollTop: $(to).offset().top}, "slow");
            });

        },
        destory: function() {

        }
    });

    return TimeLine;

});