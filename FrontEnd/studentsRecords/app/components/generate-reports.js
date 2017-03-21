import Ember from 'ember';
import Chart from 'npm:chart.js';
import jsPDF from 'npm:jspdf';
import XLSX from 'npm:xlsx-browserify-shim';

export default Ember.Component.extend({
	backgroundColours: [],
	barChart: null,
	barChartLabels: ["test"],
	barChartVals: [2],
	borderColours: [],
	categoryModel: null,
	currentCategory: null,
	currentCategoryIndex: -1,
	currentTerm: null,
	pieChartLabels: ["1","2"],
	pieChartVals: [2,4],
	store: Ember.inject.service(),
	termModel: null,
    generationWarningText: "Generating a PDF",
	init(){
		this._super(...arguments);
		
		//load term data model
		var self=this;
		this.get('store').findAll('termCode').then(function (records) {
			self.set('termModel', records);
	      	self.set('currentTerm', records.get('firstObject'));//initialize currentTerm to first dropdown item

   			//self.generateRandomData();
   		});
	    //load adjudication categories
	    this.get('store').findAll('adjudicationCategory').then(function (records) {
	    	self.set('categoryModel', records);
	    });

	},
	barChartData: Ember.computed('barChartLabels', 'barChartVals', function(){
		return{
			labels: this.get('barChartLabels'),
			datasets: [{
				data: this.get('barChartVals'),
				borderWidth: 0.5,
				label: "Students",
				backgroundColor: this.get('backgroundColours'),
				borderColor: this.get('borderColours')
			}]
		};
	}),

	pieChartData: Ember.computed('pieChartLabels', 'pieChartVals',function(){
		return {
			labels: this.get('pieChartLabels'),
			datasets: [{
				label: "axisLabel",
				data: this.get('pieChartVals'),
				backgroundColor: this.get('backgroundColours'),
				borderColor: this.get('borderColours')
			}]
		};
	}),
	generateRandomData(){
		var currentTerm = this.get('currentTerm');
		var self = this;
		var arrayOfTestAssessmentCodes = [];
		arrayOfTestAssessmentCodes[0] = this.get('store').createRecord('assessment-code', {name: "First", code: "123"});
		arrayOfTestAssessmentCodes[1] = this.get('store').createRecord('assessment-code', {name: "Second", code: "124"});
		arrayOfTestAssessmentCodes[2] = this.get('store').createRecord('assessment-code', {name: "Third", code: "125"});
		arrayOfTestAssessmentCodes[3] = this.get('store').createRecord('assessment-code', {name: "Fourth", code: "126"});
		arrayOfTestAssessmentCodes[4] = this.get('store').createRecord('assessment-code', {name: "Fifth", code: "127"});
		var numberToSave = 5;
		for (var i = 0; i < arrayOfTestAssessmentCodes.length; i++)
		{
			arrayOfTestAssessmentCodes[i].save().then(function()
			{
				numberToSave--;
				if (!numberToSave)
				{
					self.get('store').find('term-code', currentTerm.get('id')).then(function(currentTermCode){
						self.get('store').query('student', {offset: 0, limit: 100}).then(function(students){
							students.forEach(function(student, studentIndex){
								var firstNumber = Math.floor(Math.random() * (5));
								var secondNumber = Math.floor(Math.random() * (5));
								while (secondNumber === firstNumber)
								{
									secondNumber = Math.floor(Math.random() * (5));
								}
								var firstAssessmentID = arrayOfTestAssessmentCodes[firstNumber].get('id');
								var secondAssessmentID = arrayOfTestAssessmentCodes[secondNumber].get('id');
								var firstNewAdjudication = self.get('store').createRecord('adjudication', {
									date: "today"
								});
								firstNewAdjudication.set('termCode', currentTermCode);
								firstNewAdjudication.set('student', student);
								firstNewAdjudication.set('assessmentCode', arrayOfTestAssessmentCodes[firstNumber]);
								var secondNewAdjudication = self.get('store').createRecord('adjudication', {
									date: "today"
								});
								secondNewAdjudication.set('termCode', currentTermCode);
								secondNewAdjudication.set('student', student);
								secondNewAdjudication.set('assessmentCode', arrayOfTestAssessmentCodes[secondNumber]);
								firstNewAdjudication.save();
								secondNewAdjudication.save();
							});
						}); 
					});                                      
				}                
			});
		}



	},
	getRandomColour() {
		// var letters = '0123456789ABCDEF';
		// var color = '#';
		// for (var i = 0; i < 6; i++ ) {
		// 	color += letters[Math.floor(Math.random() * 16)];
		// }
		// return color;
		var hue = 'rgba(' + (Math.floor(Math.random() * 256)) + ',' + (Math.floor(Math.random() * 256)) + ',' + (Math.floor(Math.random() * 256));
		return hue;
	},
	renderBarChart() {
		let ctx = Ember.$('#barChart');
		let myChart = new Chart(ctx, {
			type: 'bar',
			data: this.get('barChartData'),
			options: {
				scaleShowLabels: false,
				scales: {
					yAxes: [{
						ticks: {
							beginAtZero:true
						}
					}]
				},
				legend: {
					display: false
				}
			}
		});

	},
	renderPieChart() {
		let ctx = Ember.$('#pieChart');
		let myChart = new Chart(ctx, {
			type: 'pie',
			data: this.get('pieChartData'),
			options: {
				legend:{
					onClick: function(e,legendItem){
						console.log("Clicked " + legendItem.text);
					}
				}
			}
		});
	},
	destroyChart() {
		$('#chart').replaceWith('<div id="chart"><canvas id="barChart"></canvas></div>');
	},
	
	actions: {
		generateReport(){
			var self=this;
			$("#open").removeClass('hideChart');
			$("#chart").removeClass('hideChart');

			var currentTerm = this.get('currentTerm');
			var termCodeID= currentTerm.get('id');
			var currentCategory = this.get('currentCategory');
			var barChartLabels=this.get('barChartLabels');
			var barChartVals=this.get('barChartVals');
			var pieChartLabels=this.get('pieChartLabels');
			var pieChartVals=this.get('barChartVals');
			console.log("category is "+currentCategory);
			console.log("currentTerm id is "+currentTerm.get('id'));
            //category 'Other' makes bar chart
            if (this.get('currentCategoryIndex') == -1)
            {
            	barChartLabels = [];
            	barChartVals = [];
            	this.get('store').query('assessmentCode', {
            		adjudicationCategory: null
            	}).then(function(assessmentCodes){
            		assessmentCodes.forEach(function(assessmentCode, codeIndex){ 
            			barChartLabels.push(assessmentCode.get('name'));
            			self.set('barChartLabels', barChartLabels);
            			var assessmentCodeID = assessmentCode.get('id');
            			self.get('store').query('adjudication', {
            				termCode: termCodeID,
            				assessmentCode: assessmentCodeID
            			}).then(function(adjudicationObjects){
            				barChartVals.push(adjudicationObjects.get('length'));
            				self.set('barChartVals', barChartVals);
            				var colour=self.getRandomColour();
            				self.get('backgroundColours').push(colour+',0.3)');
            				self.get('borderColours').push(colour+',1)');
            				self.destroyChart();
            				self.renderBarChart();
            				
            			});
            		});
            	});


            }
            //other categories make pie chart
            else{
            	this.renderPieChart();
            	pieChartLabels = [];
            	pieChartVals = [];
            	var currentCategoryID= currentCategory.get('id');
            	this.get('store').query('assessmentCode', {
            		adjudicationCategory: currentCategoryID
            	}).then(function(assessmentCodes){
            		assessmentCodes.forEach(function(assessmentCode, codeIndex){ 
            			pieChartLabels.push(assessmentCode.get('name'));
            			self.set('pieChartLabels', pieChartLabels);
            			var assessmentCodeID = assessmentCode.get('id');
            			var termCodeID= currentTerm.get('id');
            			self.get('store').query('adjudication', {
            				termCode: termCodeID,
            				assessmentCode: assessmentCodeID
            			}).then(function(adjudicationObjects){
            				pieChartVals.push(adjudicationObjects.get('length'));
            				self.set('pieChartVals', pieChartVals);
            				var colour=self.getRandomColour();
            				self.get('backgroundColours').push(colour+',0.3)');
            				self.get('borderColours').push(colour+',1)');
            				self.destroyChart();
            				self.renderPieChart();
            			});
            		});
            	});
            }

        },
        selectTerm(index){
        	this.set('currentTerm', this.get('termModel').objectAt(Number(index)));
        	console.log("new index " + this.get('currentTerm'));
        	$("#open").addClass('hideChart');
        	$("#chart").addClass('hideChart');
        },
        selectCategory(index){
        	this.set('currentCategoryIndex', index);
        	this.set('currentCategory', this.get('categoryModel').objectAt(Number(index)));
        	console.log("new index " + this.get('currentCategoryIndex'));
        	$("#open").addClass('hideChart');
        	$("#chart").addClass('hideChart');
        },
        generatePDF() {
            console.log('Generating PDF document');
            this.set('generationWarningText', 'Generating a PDF Report');
            Ember.$('.ui.basic.modal').modal({closable: false}).modal('show');
            let self = this;
            let doc = new jsPDF("portrait", "mm", "letter");
            doc.setFontSize(11);
            let data = [];
            let assessmentCategory;
            let fileName = "";
            if (this.get('currentCategoryIndex') === -1) {
                assessmentCategory = null;
                fileName = "Other_";
            } else {
                assessmentCategory = this.get('currentCategory').get('id');
                fileName = this.get('currentCategory').get('name') + '_';
            }
            fileName += this.get('currentTerm').get('name') + '.pdf';
            this.get('store').query('assessmentCode', {
                adjudicationCategory: assessmentCategory
            }).then(function (assessmentCodes) {
                let promiseArr = [];
                assessmentCodes.forEach(function (assessmentCode, index) {
                    assessmentCode.get('adjudications').forEach(function (adjudication, index) {
                        promiseArr.push(adjudication.get('student'));
                        data.push({
                            date: adjudication.get('date'),
                            name: assessmentCode.get('name'),
                            code: assessmentCode.get('code')
                        });
                        //.then(function (student) {
                            //let dataStr = student.get('firstName') + ' ' + student.get('lastName') + ' ' + student.get('studentNumber') + ' ' + adjudication.get('date') + ' ' + assessmentCode.get('name') + ' ' + assessmentCode.get('code');
                            //console.log(dataStr);
                        //});
                    });
        		});
        		return promiseArr;
        	}).then(function(promiseArr) {
        		console.log('Done getting promise array');
        		return Ember.RSVP.all(promiseArr);
        	}).then(function(students) {
        		console.log('Done getting students');
        		let pageNumber = 1;
        		if (students.length === data.length) {
        			doc.text('Page ' + pageNumber, 200, 10);
        			doc.setFont('helvetica', 'bold');
        			doc.text('Student Number', 25, 25);
        			doc.text('Student Name', 60, 25);
        			doc.text('Adjudication Date', 100, 25);
        			doc.text('Assessment Code', 140, 25);
        			doc.setFont('helvetica', '');
        			for (let i = 0; i < students.length; i++) {
        				let yPos = 32 + (7 * (i % 31));
        				doc.text(students[i].get('studentNumber'), 25, yPos);
        				doc.text(students[i].get('firstName') + ' ' + students[i].get('lastName'), 60, yPos);
        				doc.text(data[i].date, 100, yPos);
        				doc.text(data[i].name, 140, yPos);
        				doc.text(data[i].code, 170, yPos);
        				if ((i + 1) % 31 === 0) {
        					doc.addPage();
        					pageNumber++;
        					doc.text('Page ' + pageNumber, 200, 10);
        					doc.setFont('helvetica', 'bold');
        					doc.text('Student Number', 25, 25);
        					doc.text('Student Name', 60, 25);
        					doc.text('Adjudication Date', 100, 25);
        					doc.text('Assessment Code', 140, 25);
        					doc.setFont('helvetica', '');
        				}
        			}
        			doc.save(fileName);
        		} else {
        			console.log('Something went wrong! students: ' + students.length + ' datStrs: ' + dataStrs.length);
        		}
                Ember.$('.ui.basic.modal').modal('hide');
        	});
        },
        generateExcel() {
        	let data = [];
        	let assessmentCategory;
        	let temp=[];
            this.set('generationWarningText', 'Generating a CSV File');
            Ember.$('.ui.basic.modal').modal({closable: false}).modal('show');
        	var self=this;
        	if (this.get('currentCategoryIndex') === -1) {
        		assessmentCategory = null;
        	} else {
        		assessmentCategory=this.get('currentCategory').get('id');
        	}
        	this.get('store').query('assessmentCode', {
        		adjudicationCategory: assessmentCategory
        	}).then(function (assessmentCodes) {
        		let promiseArr = [];
        		assessmentCodes.forEach(function (assessmentCode, index) {
        			assessmentCode.get('adjudications').forEach(function (adjudication, index) {
        				promiseArr.push(adjudication.get('student'));
        				temp.push({
        					date: adjudication.get('date'),
        					name: assessmentCode.get('name'),
        					code: assessmentCode.get('code')
        				});
                	});
        		});
        		return promiseArr;
        	}).then(function(promiseArr) {
        		console.log('Done getting promise array');
        		return Ember.RSVP.all(promiseArr);
        	}).then(function(students) {
        		
        		for (let i=0; i <students.length; i++){
        			data.push({
        				studentNumber: students[i].get('studentNumber'),
        				studentName: students[i].get('firstName')+' '+students[i].get('lastName'),
        				date: temp[i].date, 
        				assessmentCodeName: temp[i].name,
        				assessmentCode: temp[i].code
        			});
    			}
        		
	            var title="";
	            if(self.get('currentCategoryIndex') === -1)
	            	title="Other_"+self.get('currentTerm').get('name');
	            else
	            	title=self.get('currentCategory').get('name')+'_'+self.get('currentTerm').get('name');
	            var CSV = '';
	            //CSV += title + '\r\n\n';
				//generate header
				var row = "";
			    //get header from first index of array
			    for (var index in data[0]) {
			    	row += index + ',';
			    }
			    row = row.slice(0, -1);
			    //add row
			    CSV += row + '\r\n';
			    for (var i = 0; i < data.length; i++) {
			    	var row = "";
				    //get columns
				    for (var index in data[i]) {
				    	row += '"' + data[i][index] + '",';
				    }
				    row.slice(0, row.length - 1);
				    CSV += row + '\r\n';
				}
			    var uri = 'data:text/csv;charset=utf-8,' + encodeURI(CSV);
			    console.log(uri);
			    //generate filename
			    var fileName = "";
			    //make spaces to underscores
			    fileName += title.replace(/ /g,"_");
			    var link = document.createElement("a");    
			    link.href = uri;
			    link.style = "visibility:hidden";
			    link.download = fileName + ".csv";
			    document.body.appendChild(link);
			    link.click();
			    document.body.removeChild(link);
                Ember.$('.ui.basic.modal').modal('hide');
			    //window.open(uri);
			});
    	}
        
    }
});