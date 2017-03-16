import Ember from 'ember';

export default Ember.Component.extend({
    studentsToAdjudicate: null,
    adjudicationCategories: null,
    currentTerm: null,
    termCodeModel: null,
    store: Ember.inject.service(),
    evaluateStudent: function(student, assessment, currentTerm)
    {
        var self = this;
        this.get('store').queryRecord('logical-expression', {
            assessment: assessment
        }).then(function(logicalExpression) {
            return self.send(evalutateLogicalExpression, logicalExpression, student, currentTerm);
        });

    },
    //this is the recursive function that'll go through each node
    //Async stuff is gonna fuck this hard so we're gonna have to pretty much redo it all but this is the idea
    //probs change the student and current term parameters to just be arrays or something so we don't constantly hit the DB
    //info we need it YWA, CWA, credits passed and total for term and cumulative, grades for every course taken. Definitely get that info in evaluateStudent
    evalutateLogicalExpression: function(logicalExpression, student, currentTerm)
    {
        if (logicalExpression.get('logicalLink') == "AND")
        {
            if (!evaluateBooleanExpression(logicalExpression.get('booleanExpression')))
            {
                return false;
            }
            else{
                logicalExpression.get('logicalExpressions').forEach(function(expression, index) {
                    if (!evaluateBooleanExpression(expression, student, currentTerm))
                    {
                        return false;
                    }
                });
                return true;
            }
        }
        else if (logicalExpression.get('logicalLink') == "OR"){
            if (evaluateBooleanExpression(logicalExpression.get('booleanExpression')))
            {
                return true;
            }
            else{
                logicalExpression.get('logicalExpressions').forEach(function(expression, index) {
                    if (evaluateBooleanExpression(expression, student, currentTerm))
                    {
                        return true;
                    }
                });
                return false;
            }
        }        
    },
    //this is the function that evaluates individual boolean expressions.
    //booleaExpression is a json object
    evaluateBooleanExpression: function(booleanExpression, student, currentTerm){
        //do a switch case for each possible key to evaluate
        switch (booleanExpression.key)
        {
            case "YWA":
            {

            }
            break;
            case "CWA":
            {

            }
            break;
            case "course":
            {

            }
            break;
            case "fails":
            {

            }
            break;
        }
    },
    performAdjudication: function() {
        
        var studentAdjudicationInfo = [];
        var currentTerm = this.get('currentTerm');
        var self = this;

        
        //loop through all students
        this.get('studentsToAdjudicate').forEach(function(student, studentIndex) {
            //push objID, termID, cumAVG, CumUnitsTotal, cumUnitsPassed
            console.log("student" + studentIndex + "has units passed " + student.get('cumUnitsPassed')+ " and units total " + student.get('cumUnitsTotal') + "and cumAVG " + student.get('cumAVG'));
            studentAdjudicationInfo.push({
                "studentID" : student.get('id'),
                "termCodeID": currentTerm,
                "cumAVG": student.get('cumAVG'),
                "cumUnitsTotal": student.get('cumUnitsTotal'),
                "cumUnitsPassed": student.get('cumUnitsPassed'),
                "terms": []
            });
            //loop through all terms
            console.log(student.get('terms'));
            student.get('terms').forEach(function(term, termIndex) {
                //push codeRef, termAVG, termUnitsTotal, termUnitsPassed
                var termID = term.get('id');
                console.log("term ID " + termID + "for student " + studentIndex);
                self.get('store').queryRecord('term', tertermIDm).then(function(termInfo) {
                    studentAdjudicationInfo[studentIndex].terms.push({
                        "termCodeID": termInfo.get('id'),
                        "termAVG": termInfo.get('termAVG'),
                        "termUnitsTotal": termInfo.get('termUnitsTotal'),
                        "termUnitsPassed": termInfo.get('termUnitsPassed'),
                        "grades": []
                    });
                    //get grades
                    termInfo.get('grades').forEach(function(grade, gradeIndex) {
                        var gradeID = grade.get('id');
                        console.log("grade ID " + gradeID + "for term " + termIndex + " for student" + studentIndex);
                        self.get('store').queryRecord('grade', gradeID).then(function(gradeInfo) {
                            //push mark, gradeID                         
                            studentAdjudicationInfo[studentIndex].terms[termIndex].grades.push({
                                "gradeID": gradeInfo.get('id'),
                                "mark": gradeInfo.get('mark'),
                                "courseNumber": "",
                                "courseLetter": "",
                                "unit": "",
                                "courseGroupings": []
                            });
                            //get courseCode
                            var courseCodeID = gradeInfo.get('courseCode.id');
                            self.get('store').queryRecord('course-code', courseCodeID).then(function(courseCode){
                                //push courseID, courseNumber, courseLetter, courseUnit
                                studentAdjudicationInfo[studentIndex].terms[termIndex].grades[gradeIndex].courseNumber = courseCode.get('courseNumber');
                                studentAdjudicationInfo[studentIndex].terms[termIndex].grades[gradeIndex].courseLetter = courseCode.get('courseLetter');
                                studentAdjudicationInfo[studentIndex].terms[termIndex].grades[gradeIndex].unit = courseCode.get('unit');
                                console.log(studentAdjudicationInfo);
                                 //getgroupings
                                // courseCode.get('courseGroupings').forEach(function(courseGrouping, courseGroupingIndex) {
                                //     studentAdjudicationInfo[studentIndex].terms[termIndex].grades[gradeIndex].courseGroupings.push(courseGrouping.get('id'));
                                // });
                            });
                        });
                    });
                });
            });
        });










        //loop all students
        // this.get('studentsToAdjudicate').forEach(function(student, studentIndex) {
        //     studentAdjudicationInfo.push({
        //         "ObjID": student.get('id'), 
        //         "cumAVG": student.get('cumAVG'),
        //         "cumUnitsTotal": student.get('cumUnitsTotal'),
        //         "cumUnitsPassed": student.get('cumUnitsPassed'),
        //         "termAVG": "",
        //         "termUnitsTotal": "",
        //         "termUnitsPassed": "",
        //         "coursesCompleted": []
        //     });
        //     var studentID = student.get('id');
        //     var termCodeID = currentTerm;
        //     self.get('store').queryRecord('term', {
        //         student: studentID,
        //         termCode: termCodeID
        //     }).then(function(term) {
        //         studentAdjudicationInfo[studentIndex].termAVG = term.get('termAVG');
        //         studentAdjudicationInfo[studentIndex].termUnitsTotal = term.get('termUnitsTotal');
        //         studentAdjudicationInfo[studentIndex].termUnitsPassed = term.get('termUnitsPassed');
        //         var termID = term.get('id');
        //         self.get('store').query('grade', {
        //             term: termID
        //         }).then(function(grades) {
        //             grades.forEach(function(grade, gradeIndex) {
        //                 var mark = grade.get('mark');
        //                 var courseCodeID = grade.get('courseCode').get('id');
        //                 studentAdjudicationInfo[studentIndex].coursesCompleted.push({
        //                     "courseNumber": "",
        //                     "courseLetter": "",
        //                     "unit": "",
        //                     "mark": mark                            
        //                 });
        //                 self.get('store').queryRecord('courseCode', {courseCodeID: courseCodeID}).then(function (courseCode) {
        //                     var courseLetter = courseCode.get('courseLetter');
        //                     var courseNumber = courseCode.get('courseNumber');
        //                     var unit = courseCode.get('unit');
        //                     studentAdjudicationInfo[studentIndex].coursesCompleted[gradeIndex].courseNumber = courseNumber;
        //                     studentAdjudicationInfo[studentIndex].coursesCompleted[gradeIndex].courseLetter = courseLetter;
        //                     studentAdjudicationInfo[studentIndex].coursesCompleted[gradeIndex].unit = unit;
        //                     console.log(studentAdjudicationInfo);
        //                 });
        //             });
        //         });
        //    });
        // });
    },

    init()
    {
        this._super(...arguments);
        var self=this;

        //CHANGE THIS SO FAST
        this.get('store').query('student', {offest: 0, limit: 100}).then(function (records) {
            self.set('studentsToAdjudicate', records);
        });    

        this.get('store').findAll('term-code').then(function (records) {
            self.set('termCodeModel', records);
        });    
 
    },

    actions: {
    
        adjudicate()
        {
            this.performAdjudication();           
        },
        selectTerm(termCodeID){
            this.set('currentTerm', termCodeID);
            console.log(termCodeID);
        }
    }
});
