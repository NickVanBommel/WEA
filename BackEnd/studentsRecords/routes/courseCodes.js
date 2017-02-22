var express = require('express');
var router = express.Router();
var CourseCode = require('../models/courseCode');
var Grade = require('../models/grade');
var bodyParser = require('body-parser');
var parseUrlencoded = bodyParser.urlencoded({extended: false});
var parseJSON = bodyParser.json();

router.route('/')
	.post(parseUrlencoded, parseJSON, function (request, response) {
        var courseCode = new CourseCode(request.body.courseCode);
        courseCode.save(function(error) {
            if (error) {
                response.send(error);
                console.log(error);
            } else {
                response.json({courseCode: courseCode});
            }
        });
    })
    .get(parseUrlencoded, parseJSON, function (request, response) {
        if (request.query.deleteAll){
            CourseCode.remove({}, function(error){
                if (error) {
                    response.send(error);
                } else {
                    CourseCode.find(function (error, courseCode){
                        if (error) {
                            response.send(error);
                        } else {
                            response.json({courseCode: courseCode});
                        }
                    });
                }
                console.log('removed courseCodes');
            });
        }
        else if (request.query.courseLetter && request.query.courseNumber)
        {
            CourseCode.findOne({courseLetter: request.query.courseLetter, courseNumber: request.query.courseNumber}, function(error, courseCode) {
                if (error) {
                    response.send(error);
                    console.log("error trying to find a course by number and letter");
                } else {
                    response.send({courseCode: courseCode});
                }
            });
        } else{
            CourseCode.find(function(error, courseCodes) {
                if (error) {
                    response.send(error);
                } else {
                    response.json({courseCodes: courseCodes});
                }
            });
        }
    });

router.route('/:courseCode_id')
    .get(parseUrlencoded, parseJSON, function (request, response) {
        CourseCode.findById(request.params.courseCode_id, function (error, courseCode) {
            if (error) {
                response.send(error);
            } else {
                response.json({courseCode: courseCode});
            }
        });
    })
    .delete(parseUrlencoded, parseJSON, function (request, response) {
        CourseCode.findByIdAndRemove(request.params.courseCode_id, function(error, courseCode) {
            let failed = false;
            if(error) {
                failed = true;
                response.send(error);
            } else if (courseCode && courseCode.grades.length > 0) {
                let completed = 0;
                for (let i = 0; i < courseCode.grades.length && !failed; i++) {
                    Grade.findById(courseCode.grades[i], function (error, grade) {
                        if (error && !failed) {
                            failed = true;
                            response.send(error);
                        } else if (grade) {
                            grade.courseCode = null;

                            grade.save(function (error) {
                                if (error && !failed) {
                                    failed = true;
                                    response.send(error);
                                } else {
                                    completed++;
                                    if (completed === courseCode.grades.length && !failed) {
                                        response.json({deleted: courseCode});
                                    }
                                }
                            });
                        } else {
                            completed++;
                            if (completed === courseCode.grades.length && !failed) {
                                response.json({deleted: courseCode});
                            }
                        }
                    });
                }
            } else {
                response.json({deleted: courseCode});
            }
        });
    });

module.exports = router;
    //Expand later.