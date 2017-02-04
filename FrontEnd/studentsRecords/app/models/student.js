	import DS from 'ember-data';

export default DS.Model.extend({
  
  DOB: DS.attr(),
  firstName: DS.attr(),
  gender: DS.belongsTo('gender'),
  lastName: DS.attr(),
  number: DS.attr(),
  photo: DS.attr(),
  resInfo: DS.belongsTo('residency')
  

});
