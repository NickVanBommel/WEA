import Ember from 'ember';
import Mutex from 'ember-mutex';

export default Ember.Component.extend({
    studentsToAdjudicate: null,
    adjudicationCategories: null,
    nonCategoryAdjudications: null,
    adjudicationCategoriesAssessmentCodes: null,
    currentTerm: null,
    termCodeModel: null,
    parsingProgress: 0,
    parsingTotal: 1000,
    evaluationProgress: 0,
    evaluationTotal: 1000,
    savingProgress: 0,
    savingTotal: 1000,
    studentInformation: null,
    store: Ember.inject.service(),


    init()
    {
        this._super(...arguments);
        var self=this;

        this.get('store').findAll('term-code').then(function (records) {
            self.set('termCodeModel', records);
        }); 
        this.get('store').findAll('adjudication-category').then(function(records) {
            self.set('adjudicationCategories', records);
        });
        this.get('store').query('assessment-code', {noCategory: true}).then(function(records) {
            self.set('nonCategoryAdjudications', records);
        });
    },

    determineProgress(newProgress, newTotal)
    {
        if (this.get('parsingProgress')/this.get('parsingTotal') <= newProgress/newTotal)
        {
            this.set('parsingTotal', newTotal);
            this.set('parsingProgress', newProgress);            
            return (newTotal == newProgress);
        }
        else{
            return false;
        }
    },
    performAdjudication(){

        var self = this;
        var studentInformation = this.get('studentInformation');
        var totalSize = 0;
        //initialize total size
        this.get('adjudicationCategories').forEach(function(category, categoryIndex) {
            totalSize += category.get('assessmentCodes').get('length') * studentInformation.length;
        });
        totalSize += this.get('nonCategoryAdjudications').get('length') * studentInformation.length;
        self.set('evaluationTotal', totalSize);
        this.get('nonCategoryAdjudications').forEach(function(assessmentCode, assessmentCodeIndex) {
            evaluateNonCategoryAssessmentCode(assessmentCode);
        });        
        this.get('adjudicationCategories').forEach(function(category, categoryIndex) {
            this.evaluateCategoryAssessmentCode(category.get('assessmentCodes').get('firstObject'), 0, categoryIndex);
        });
    },
    evaluateCategoryAssessmentCode(assessmentCodeToEvaluate, indexOfCode, categoryIndex)
    {
        //blah blah blah evaluate student with assessmentCode if false
        self.evaluateCategoryAssessmentCode(self.get('adjudicationCategories').objectAt(categoryIndex).get('assessmentCodes').objectAt(indexOfCode++), indexOfCode, categoryIndex);
    },
    evaluateNonCategoryAssessmentCode(passedAssessmentCode)
    {
        var assessmentCodeID = passedAssessmentCode.get('id');
        var self = this;
        //get the assessmentCode obj we are working with
        this.get('store').find('assessmentCode', assessmentCodeID).then(function(assessmentCode){
            //get the root logical expression
            var logicalExpressionID = assessmentCode.get('logicalExpression').get('id');
            self.get('store').find('logical-expression', logicalExpressionID).then(function(logicalExpression){
                //get the boolean expression from the root and set an empty array if there are children
                var expressionBoolean = logicalExpression.get('booleanExpression');
                expressionBoolean.childBooleans = [];
                //if there are children
                if (logicalExpression.get('logicalExpressions').get('length') > 0)
                {
                    var rootExpressionChildrenCount = logicalExpression.get('logicalExpressions').get('length');
                    var done = ()=>{
                        rootExpressionChildrenCount--;
                        if(rootExpressionChildrenCount){
                            return;
                        }
                        self.evaluateStudents(expressionBoolean);
                    }
                    function fetchAssociated(parent,childID,callback){
                        self.get('store').find('logicalExpression', childID).then(function(childLogicalExpressionOBJ){
                            child = childLogicalExpressionOBJ.get('booleanExpression');
                            child.childBooleans = [];
                            parent.childBooleans.push(child);
                            childLogicalExpressionOBJ.get('logicalExpressions').forEach((childLogicalExpression)=>{
                                rootExpressionChildrenCount++;
                                fetchAssociated(child,childLogicalExpression.get('id'),callback);
                            })
                            if(childLogicalExpressionOBJ.get('length') == 0){
                                callback();
                            }
                        })
                    }
                    logicalExpression.get('logicalExpressions').forEach(function(childLogicalExpression, childIndex){
                        fetchAssociated(expressionBoolean,childLogicalExpression.get('id'),done);
                    });
                } 
                else{
                    self.evaluateStudents(expressionBoolean);
                }               
            });
        });
    },
    evaluateStudents(evaluationJSON){
        
    },
    actions: {    
        adjudicate()
        {
            var studentAdjudicationInfo = [];
            var currentTerm = this.get('currentTerm');
            var self = this;
            var readingMutex = Mutex.create();
            var erroredValues = [];
            var currentProgress = 0;
            var currentTotal = 0;
            var doneReading = false;
            var doneReadingMutex = Mutex.create();
            
            this.get('store').query('student', {offset: 0, limit: 100}).then(function (records) {
                currentTotal += records.get('length');                
                records.forEach(function(student, studentIndex) {
                    //push objID, termID, cumAVG, CumUnitsTotal, cumUnitsPassed
                    readingMutex.lock(function() {
                        studentAdjudicationInfo[studentIndex] = {
                            "studentID" : student.get('id'),
                            "termCodeID": currentTerm,
                            "cumAVG": student.get('cumAVG'),
                            "cumUnitsTotal": student.get('cumUnitsTotal'),
                            "cumUnitsPassed": student.get('cumUnitsPassed'),
                            "terms": []
                        };
                        currentProgress++; 
                        self.determineProgress(currentProgress, currentTotal);  
                        var studentOBJid = student.get('id');
                        self.get('store').query('term', {student: studentOBJid}).then(function(terms){
                            currentTotal += terms.get('length');
                            terms.forEach(function(term, termIndex) {                
                               //push codeRef, termAVG, termUnitsTotal, termUnitsPassed
                                var termID = term.get('id');
                                self.get('store').find('term', termID).then(function(termInfo) {
                                    studentAdjudicationInfo[studentIndex].terms[termIndex] = {
                                        "termCodeID": termInfo.get('id'),
                                        "termAVG": termInfo.get('termAVG'),
                                        "termUnitsTotal": termInfo.get('termUnitsTotal'),
                                        "termUnitsPassed": termInfo.get('termUnitsPassed'),
                                        "grades": []
                                    };
                                    currentProgress++;  
                                    currentTotal += term.get('grades').get('length');
                                    self.determineProgress(currentProgress, currentTotal);
                                    //get grades
                                    var inGradeMutexIndex = 0;
                                    termInfo.get('grades').forEach(function(grade, index) {
                                        var gradeID = grade.get('id');
                                        self.get('store').find('grade', gradeID).then(function(gradeInfo) {                                                
                                            var gradeIndex = inGradeMutexIndex++;
                                            //push mark, gradeID                        
                                            studentAdjudicationInfo[studentIndex].terms[termIndex].grades[gradeIndex] = {
                                                "gradeID": gradeInfo.get('id'),
                                                "mark": gradeInfo.get('mark'),
                                                "courseNumber": "",
                                                "courseLetter": "",
                                                "unit": "",
                                                "courseGroupings": []
                                            };
                                            //get courseCode
                                            var courseCodeID = gradeInfo.get('courseCode.id');
                                            self.get('store').find('course-code', courseCodeID).then(function(courseCode){
                                                //push courseID, courseNumber, courseLetter, courseUnit
                                                
                                                studentAdjudicationInfo[studentIndex].terms[termIndex].grades[gradeIndex].courseNumber = courseCode.get('courseNumber');
                                                studentAdjudicationInfo[studentIndex].terms[termIndex].grades[gradeIndex].courseLetter = courseCode.get('courseLetter');
                                                studentAdjudicationInfo[studentIndex].terms[termIndex].grades[gradeIndex].unit = courseCode.get('unit');
                                                currentProgress++;                                                
                                                //getgroupings
                                                // courseCode.get('courseGroupings').forEach(function(courseGrouping, courseGroupingIndex) {
                                                //     studentAdjudicationInfo[studentIndex].terms[termIndex].grades[gradeIndex].courseGroupings.push(courseGrouping.get('id'));
                                                // });
                                                doneReadingMutex.lock(function() {
                                                    if (self.determineProgress(currentProgress, currentTotal) && !doneReading)
                                                    {
                                                        self.set('studentInformation', studentAdjudicationInfo);
                                                        doneReading = true;
                                                        //do actual evaluation
                                                        console.log("done reading.... time to evaluate");
                                                    }
                                                })
                                            });
                                        });                                        
                                    });
                                });
                            });
                        });
                    });                                      
                }); 
            }); 
        },
        selectTerm(termCodeID){
            this.set('currentTerm', termCodeID);
        }
    }
});
