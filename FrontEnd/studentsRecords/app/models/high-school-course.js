import DS from 'ember-data';

export default DS.Model.extend({
	grade: DS.hasMany('high-school-grade'),
	level: DS.attr(),
	source: DS.attr(),
	unit: DS.attr('number'),
	school: DS.belongsTo('high-school'),
	course: DS.belongsTo('high-school-subject')
});
