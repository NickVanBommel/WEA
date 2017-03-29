import Ember from 'ember';

export default Ember.Component.extend({
  isUsersShowing: true,
  isFeatureEditing: false,
  isRolesEditing: false,
  isAdjudicationRulesEditing: false,
  isAdjudicationCategoriesIsShowing: false,
  ADM01IsPermitted: Ember.computed(function(){ //Manage system roles
    var authentication = this.get('oudaAuth');
    if (authentication.getName === "Root") {
      return true;
    } else {
      return (authentication.get('userCList').indexOf("ADM01") >= 0);
    }
  }),

  didRender(){
    Ember.$('.menu .item').tab();
    Ember.$('.ui.menu').find('.item').tab('change tab', 'second');
  },

  actions: {
    manageUsers () {
      this.set('isUsersShowing', true);
      this.set('isFeaturesEditing', false);
      this.set('isRolesEditing', false);
      this.set('isAdjudicationRulesEditing', false);
      this.set('isAdjudicationCategoriesIsShowing', false);
    },
    manageRoles (){
      this.set('isUsersShowing', false);
      this.set('isFeaturesEditing', false);
      this.set('isRolesEditing', true);
      this.set('isAdjudicationRulesEditing', false);
      this.set('isAdjudicationCategoriesIsShowing', false);
    },

    manageFeatures (){
      this.set('isUsersShowing', false);
      this.set('isFeaturesEditing', true);
      this.set('isRolesEditing', false);
      this.set('isAdjudicationRulesEditing', false);
      this.set('isAdjudicationCategoriesIsShowing', false);
    },

    manageAdjudication (){
      this.set('isUsersShowing', false);
      this.set('isFeaturesEditing', false);
      this.set('isRolesEditing', false);
      this.set('isAdjudicationRulesEditing', true);
      this.set('isAdjudicationCategoriesIsShowing', false);
    },
    manageAdjudicationCategories() {      
      this.set('isUsersShowing', false);
      this.set('isFeaturesEditing', false);
      this.set('isRolesEditing', false);
      this.set('isAdjudicationRulesEditing', false);
      this.set('isAdjudicationCategoriesIsShowing', true);
    }
  }
});
