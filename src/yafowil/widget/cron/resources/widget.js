/* jslint browser: true */
/* global jQuery, yafowil */
/*
 * yafowil cron widget
 *
 * Optional: bdajax
 */

if (window.yafowil === undefined) {
    window.yafowil = {};
}

(function($, yafowil) {
    "use strict";

    $(document).ready(function() {
        // initial binding
        yafowil.cron.binder();

        // add after ajax binding if bdajax present
        if (window.bdajax !== undefined) {
            $.extend(window.bdajax.binders, {
                cron_binder: yafowil.cron.binder
            });
        }
    });

    $.extend(yafowil, {

        cron: {

            max_year: 2099,
            current_year: new Date().getFullYear(),

            maxlengths: function () {
                return {
                    'minute': 60,
                    'hour': 24,
                    'dom': 31,
                    'month': 12,
                    'dow': 7,
                    'year': this.max_year - this.current_year + 1
                };
            },

            monthmap: {
                1: 'January',
                2: 'February',
                3: 'March',
                4: 'April',
                5: 'May',
                6: 'June',
                7: 'July',
                8: 'August',
                9: 'September',
                10: 'October',
                11: 'November',
                12: 'December'
            },

            dowmap: {
                1: 'Monday',
                2: 'Tuesday',
                3: 'Wednesday',
                4: 'Thursday',
                5: 'Friday',
                6: 'Saturday',
                0: 'Sunday'
            },

            getContainer: function ($el) {
                return $el.closest('.cron-value');
            },
            getEditarea: function ($el) {
                return $('.editarea', $el.closest('.crontab.widget'));
            },
            getMode: function ($el) {
                var klass = $el.attr('class');
                if (klass.indexOf('minute') != -1) {
                    return 'minute';
                } else if (klass.indexOf('hour') != -1) {
                    return 'hour';
                } else if (klass.indexOf('dom') != -1) {
                    return 'dom';
                } else if (klass.indexOf('month') != -1) {
                    return 'month';
                } else if (klass.indexOf('dow') != -1) {
                    return 'dow';
                } else if (klass.indexOf('year') != -1) {
                    return 'year';
                }
            },

            binder: function () {
                $('.crontab.widget button.edit').on('click', function (event) {
                    event.preventDefault();
                    var cnt;
                    var $el = $(this);
                    var $container = yafowil.cron.getContainer($el);
                    var mode = yafowil.cron.getMode($container);
                    var $editarea = yafowil.cron.getEditarea($el);

                    if ($editarea.is(':visible') && $editarea.hasClass(mode)) {
                        $container.removeClass('active');
                        $editarea.removeClass().addClass('editarea').html('').hide();
                        return;
                    }

                    yafowil.cron.value.parseFromInput($el);

                    var header = $('<h2 />');
                    var content = $('<div class="editcontainer" />');

                    if (mode === 'minute') {
                        header.text('Select Minutes');
                        for (cnt=0; cnt <= 59; cnt++) {
                            content.append(yafowil.cron.valuebutton(cnt, cnt, mode));
                        }
                    } else if (mode === 'hour') {
                        header.text('Select Hours');
                        for (cnt=1; cnt <= 24; cnt++) {
                            var hour = cnt < 24 ? cnt : 0;  // "0" should be rendered as last element.
                            content.append(yafowil.cron.valuebutton(hour, hour, mode));
                        }
                    } else if (mode === 'dom') {
                        header.text('Select Day of Month');
                        for (cnt=1; cnt <= 31; cnt++) {
                            content.append(yafowil.cron.valuebutton(cnt, cnt, mode));
                        }
                    } else if (mode === 'month') {
                        header.text('Select Month');
                        for (cnt=1; cnt <= 12; cnt++) {
                            content.append(yafowil.cron.valuebutton(
                                cnt,
                                yafowil.cron.monthmap[cnt],
                                mode
                            ));
                        }
                    } else if (mode === 'dow') {
                        header.text('Select Day of Week');
                        for (cnt=1; cnt <= 7; cnt++) {
                            var dow = cnt < 7 ? cnt : 0;  // "0" should be rendered as last element.
                            content.append(yafowil.cron.valuebutton(
                                dow,
                                yafowil.cron.dowmap[dow],
                                mode
                            ));
                        }
                    } else if (mode === 'year') {
                        header.text('Select Year');
                        for (cnt=yafowil.cron.current_year; cnt <= yafowil.cron.max_year; cnt++) {
                            content.append(yafowil.cron.valuebutton(cnt, cnt, mode));
                        }
                    }

                    content = header.add(content);
                    $editarea.html(content);
                    $editarea.removeClass('').addClass('editarea').addClass(mode).show();
                    $container.addClass('active');
                });

                // Add Summary
                var summarycontainer_template = '' +
                    '<article class="crontab_summary">' +
                        '<strong>Summary</strong>' +
                        '<p class="summary"></p>' +
                    '</article>';

                $('.crontab.widget').each(function () {
                    $('input[type="hidden"]', $(this)).each(function () {
                        var $container = yafowil.cron.getContainer($(this));
                        yafowil.cron.value.parse_part(
                            $(this).val(),
                            yafowil.cron.getMode($container)
                        );
                    });
                    $(this).append($(summarycontainer_template));
                    yafowil.cron.update_summary($(this));
                });

                $('.display-crontab.widget').each(function () {
                    yafowil.cron.value.parse(
                        $('code', $(this)).text()
                    );
                    $(this).append($(summarycontainer_template));
                    yafowil.cron.update_summary($(this));
                });

            },

            valuebutton: function (value, name, mode) {
                var button = $('<button class="btn btn-sm" name=' + value + '>' + name + '</button>');
                if (yafowil.cron.value.has(value, mode)) {
                    button.addClass('active');
                }
                button.on('click', yafowil.cron.valuebutton_eventhandler);
                button.on('mouseenter', function (event) {
                    // support multiple selection by holding down the "shift" key.
                    if (event.shiftKey === false) {
                        return;
                    }
                    yafowil.cron.valuebutton_eventhandler.bind(this)(event);
                });
                return button;
            },

            valuebutton_eventhandler: function (event) {
                event.preventDefault();
                var $el = $(this);
                var $container = $el.closest('.editarea');
                if ($el.hasClass('active')) {
                    yafowil.cron.value.remove($(this).attr('name'), yafowil.cron.getMode($container));
                    yafowil.cron.value.serializeToInput($el);
                    yafowil.cron.update_summary($el);
                    $el.removeClass('active');
                } else {
                    yafowil.cron.value.add($(this).attr('name'), yafowil.cron.getMode($container));
                    yafowil.cron.value.serializeToInput($el);
                    yafowil.cron.update_summary($el);
                    $el.addClass('active');
                }
            },

            update_summary: function ($el) {
                var container = $el.closest('div.widget');
                $('.crontab_summary .summary', container).html(
                    yafowil.cron.value.summarize()
                );
            },

            value: {
                value: {
                    'minute': [],
                    'hour': [],
                    'dom': [],
                    'month': [],
                    'dow': [],
                    'year': []
                },
                add: function (value, mode) {
                    this.value[mode].push(value.toString());
                },
                remove: function (value, mode) {
                    var index = this.value[mode].indexOf(value.toString());
                    if (index > -1) {
                        this.value[mode].splice(index, 1);
                    }
                },
                has: function (value, mode) {
                    return this.value[mode].indexOf(value.toString()) > -1;
                },
                parse: function (value) {
                    value = value.split(' ');
                    if (value.length === 5) {
                        // year is optional
                        value.push('*');
                    }
                    this.parse_part(value[0].trim(), 'minute');
                    this.parse_part(value[1].trim(), 'hour');
                    this.parse_part(value[2].trim(), 'dom');
                    this.parse_part(value[3].trim(), 'month');
                    this.parse_part(value[4].trim(), 'dow');
                    this.parse_part(value[5].trim(), 'year');
                },
                parse_part: function (value, mode) {
                    if (typeof value === 'string') {
                        value = value.split(',');
                    }
                    this.value[mode] = [];
                    var cnt;
                    if (value[0] === '*') {
                        var start, end;
                        if (mode === 'minute') {
                            start = 0; end = 59;
                        } else if (mode === 'hour') {
                            start = 0; end = 23;
                        } else if (mode === 'dom') {
                            start = 1; end = 31;
                        } else if (mode === 'month') {
                            start = 1; end = 12;
                        } else if (mode === 'dow') {
                            start = 0; end = 6;
                        } else if (mode === 'year') {
                            start = yafowil.cron.current_year;
                            end = yafowil.cron.max_year;
                        }
                        for (cnt=start; cnt<end+1; cnt++) {
                            this.value[mode].push(cnt);
                        }
                    } else {
                        for (cnt=0; cnt<value.length; cnt++) {
                            var val = value[cnt];
                            if (val === '') {
                                continue;
                            }
                            val = parseInt(val, 10).toString();
                            this.value[mode].push(val);
                        }
                    }
                },
                serialize: function (mode) {
                    var vals = this.value[mode];
                    vals.sort(function(a, b) {
                        // int-sort - otherwise it's a lexical sort.
                        return parseInt(a, 10) - parseInt(b, 10);
                    });

                    var maxlength = yafowil.cron.maxlengths()[mode];
                    if (vals.length >= maxlength) {
                        return '*';
                    } else {
                        return vals.join(',');
                    }
                },
                parseFromInput: function ($el) {
                    var $container = yafowil.cron.getContainer($el);
                    var $input = $('input', $container);
                    var mode = yafowil.cron.getMode($container);
                    this.parse_part($input.val(), mode);
                },
                serializeToInput: function ($el) {
                    var $container = $el.closest('.editarea');
                    var mode = yafowil.cron.getMode($container);
                    var $input = $('.cron.value.' + mode + ' input', $container.closest('.yafowil.widget'));
                    $input.val(this.serialize(mode));
                },
                summarize: function () {
                    var text = {
                        'minute': '',
                        'hour': '',
                        'dom': '',
                        'month': '',
                        'dow': '',
                        'year': ''
                    };
                    var maxlengths = yafowil.cron.maxlengths();

                    if (this.value['minute'].length < maxlengths['minute']) {
                        text['minute'] = 'Every ' + this.value['minute'].join('., ') + '. minute, ';
                    } else {
                        text['minute'] = 'Each minute, ';
                    }

                    if (this.value['hour'].length < maxlengths['hour']) {
                        text['hour'] = 'every ' + this.value['hour'].join('., ') + '. hour, ';
                    } else {
                        text['hour'] = 'each hour, ';
                    }

                    if (this.value['dom'].length < maxlengths['dom']) {
                        text['dom'] = 'every ' + this.value['dom'].join('., ') + '. day of the month, ';
                    } else {
                        text['dom'] = 'any day of the month, ';
                    }

                    if (this.value['month'].length < maxlengths['month']) {
                        text['month'] = 'in the months: ' + this.value['month'].map(
                            function (el) {
                                return yafowil.cron.monthmap[el];
                            }
                        ).join(', ') + ', ';
                    } else {
                        text['month'] = 'any month, ';
                    }

                    if (this.value['dow'].length < maxlengths['dow']) {
                        text['dow'] = 'on ' + this.value['dow'].map(
                            function (el) {
                                return yafowil.cron.dowmap[el];
                            }
                        ).join('s, ') + 's, ';
                    } else {
                        text['dow'] = 'on any day, ';
                    }

                    if (this.value['year'].length < maxlengths['year']) {
                        text['year'] = 'in the years: ' + this.value['year'].join(', ') + '.';
                    } else {
                        text['year'] = 'any year.';
                    }

                    return text['minute'] + '<br/>' +
                           text['hour'] + '<br/>' +
                           text['dom'] + '<br/>' +
                           text['month'] + '<br/>' +
                           text['dow'] + '<br/>' +
                           text['year'] + '<br/>';
                }
            }
        }
    });

})(jQuery, yafowil);
