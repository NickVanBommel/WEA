var express = require('express');
var router = express.Router();
var CourseCode = require('../models/courseCode');
var bodyParser = require('body-parser');
var parseUrlencoded = bodyParser.urlencoded({extended: false});
var parseJSON = bodyParser.json();

router.route('/')
	.post(parseUrlencoded, parseJSON, function (request, response) {
        var courseCode = new CourseCode(request.body.courseCode);
        courseCode.save(function(error) {
            if (error)
                response.send(error);
            response.json({courseCode: courseCode});
        });
    })
    .get(parseUrlencoded, parseJSON, function (request, response) {
        CourseCode.find(function(error, courseCodes) {
                if (error)
                    response.send(error);
                response.json({courseCodes: courseCodes});
        });
    });

    //Expand later.