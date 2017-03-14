var mongoose = require('mongoose');
var mongoosePaginate = require('mongoose-paginate');

var courseCodeSchema = mongoose.Schema(
    {
        courseLetter: String,
        courseNumber: String,
        name: String,
        unit: Number,
        grades: [{type: mongoose.Schema.ObjectId, ref: 'Grade'}]
    },
    {
        versionKey: false
    }
);

courseCodeSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('courseCode', courseCodeSchema);