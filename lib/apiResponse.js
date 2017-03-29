/**
 * Created by makere001c on 3/28/17.
 */
//A Module to capture Every API Response Time

var logger = require('./logger_module');
var path = require('path');
var start, startInMSecs, end, endInMSecs, difference, data, link;

module.exports = {

    startTime: function (loc){
        start = new Date();
        startInMSecs = start.getTime();
        return startInMSecs;
    },

    endTime: function(req){
        end = new Date();
        endInMSecs = end.getTime();
        difference = (endInMSecs - startInMSecs);
        req = req.payload.request.method;
        data = logger.info('It took ' + difference + ' milliseconds for the ' + req + ' call ');
        return data;
    }

}