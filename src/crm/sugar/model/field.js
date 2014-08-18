// Copyright 2014 YDN Authors. All Rights Reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
//    This program is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.


/**
 * @fileoverview SugarCRM module record model.
 */


goog.provide('ydn.crm.sugar.model.Field');
goog.require('ydn.crm.sugar.Record');
goog.require('ydn.crm.sugar.gdata');



/**
 * SugarCRM module record model.
 * @param {ydn.crm.sugar.model.Group} parent
 * @param {string} field name
 * @constructor
 * @struct
 */
ydn.crm.sugar.model.Field = function(parent, field) {
  /**
   * @final
   * @protected
   * @type {ydn.crm.sugar.model.Group}
   */
  this.parent = parent;
  /**
   * @final
   * @protected
   * @type {string}
   */
  this.field_name = field;
  // goog.asserts.assertObject(this.parent.getFieldInfo(this.field_name),
  //    this.field_name + ' in ' + parent.getModuleName());
};


/**
 * @return {ydn.crm.sugar.ModuleName}
 */
ydn.crm.sugar.model.Field.prototype.getModuleName = function() {
  return this.parent.getModuleName();
};


/**
 * @return {string}
 */
ydn.crm.sugar.model.Field.prototype.getFieldName = function() {
  return this.field_name;
};


/**
 * Get module info.
 * @return {SugarCrm.ModuleField}
 */
ydn.crm.sugar.model.Field.prototype.getFieldInfo = function() {
  return this.parent.getFieldInfo(this.field_name);
};


/**
 * Get unique field id within sugarcrm instance.
 * @param {string} module_name
 * @param {string} field_name
 * @return {string}
 */
ydn.crm.sugar.model.Field.getFieldId = function(module_name, field_name) {
  return module_name + '-' + field_name;
};


/**
 * Get unique field id within sugarcrm instance.
 * @return {string}
 */
ydn.crm.sugar.model.Field.prototype.getFieldId = function() {
  return ydn.crm.sugar.model.Field.getFieldId(this.parent.getModuleName(),
      this.field_name);
};


/**
 * Get field value.
 * @return {?string}
 */
ydn.crm.sugar.model.Field.prototype.getFieldValue = function() {
  return this.parent.module.value(this.field_name);
};


/**
 * Get field value without casting to string.
 * @return {*}
 */
ydn.crm.sugar.model.Field.prototype.getField = function() {
  return this.getFieldValue();
};


/**
 * @return {boolean} true if field has value set.
 */
ydn.crm.sugar.model.Field.prototype.hasFieldValue = function() {
  var v = this.getFieldValue();
  return goog.isString(v) ? !goog.string.isEmpty(v) : goog.isDefAndNotNull(v);
};


/**
 * @return {!Object.<SugarCrm.NameValue>}
 */
ydn.crm.sugar.model.Field.prototype.getOptions = function() {
  var info = this.getFieldInfo();
  return info.options || {};
};


/**
 * Get field label.
 * @return {string} field label, default to SugarCrm.ModuleField#label.
 */
ydn.crm.sugar.model.Field.prototype.getLabel = function() {
  var info = this.getFieldInfo();
  return goog.isString(info.label) ? info.label.replace(/:$/, '') : info.label;
};


/**
 * @return {string} default to 'varchar'
 */
ydn.crm.sugar.model.Field.prototype.getType = function() {
  var info = this.getFieldInfo();
  return info ? info.type || 'varchar' : 'varchar';
};


/**
 * @const
 * @type {!Array.<string>}
 */
ydn.crm.sugar.model.Field.NORMALLY_HIDE = ['full_name', 'converted', 'date_entered', 'date_modified',
  'modified_user_id', 'modified_by_name', 'created_by', 'created_by_name', 'deleted', 'account_id',
  'email_and_name1', 'invalid_email', 'team_id',
  'team_set_id', 'team_count', 'assigned_user_id', 'preferred_language', 'status', 'id'];


/**
 * List of normally hide group names.
 * @const
 * @type {Array.<string>}
 */
ydn.crm.sugar.model.Field.NORMALLY_SHOW = ['name', 'email'];


/**
 * Return default setting.
 * @param {string} name group name.
 * @return {boolean}
 */
ydn.crm.sugar.model.Field.isNormallyHide = function(name) {
  return ydn.crm.sugar.model.Field.NORMALLY_SHOW.indexOf(name) == -1;
};


/**
 * Get user setting.
 * @return {*}
 */
ydn.crm.sugar.model.Field.prototype.getUserSetting = function() {
  var setting = this.parent.getUserSetting();
  return goog.isObject(setting) ? goog.object.getValueByKeys(setting, ['fields', this.field_name]) : null;
};


/**
 * Check the field value is calculated or not.
 * @return {boolean}
 */
ydn.crm.sugar.model.Field.prototype.isCalculated = function() {
  var setting = this.getFieldInfo();
  return setting ? !!setting['calculated'] : false;
};


/**
 * Menu commands.
 * @enum {string}
 */
ydn.crm.sugar.model.Field.Command = {
  ADD: 'add',
  EDIT: 'edit',
  OPT_OUT: 'optout',
  PRIMARY: 'primary',
  REMOVE: 'remove'
};


/**
 * @typedef {{
 *   label: string,
 *   name: ydn.crm.sugar.model.Field.Command,
 *   value: *,
 *   type: (string|undefined)
 * }}
 * label: menu text.
 * name: commend in dispatching event.
 * type: SugarCrm.ModuleField#type for input type, default to type='text', for
 * 'bool', it becomes type='checkbox'
 * When type is 'bool', value can be 'true' or 'false'.
 */
ydn.crm.sugar.model.Field.FieldOption;


/**
 * Check the field value is deletable.
 * Extra field like, phone number, address, email are deletable.
 * @return {Array.<ydn.crm.sugar.model.Field.FieldOption>}
 */
ydn.crm.sugar.model.Field.prototype.getMoreOptions = function() {
  return [];
};


/**
 * @return {boolean}
 */
ydn.crm.sugar.model.Field.prototype.isNormallyHide = function() {
  var setting = this.getUserSetting();
  return setting ? !!setting['normallyHide'] : ydn.crm.sugar.model.Field.isNormallyHide(this.field_name);
};


if (goog.DEBUG) {
  /**
   * @inheritDoc
   */
  ydn.crm.sugar.model.Field.prototype.toString = function() {
    return this.parent + ';Field:' + this.field_name;
  };
}


/**
 * Get the patch object for given user input field value.
 * @param {*} value input value.
 * @return {?Object} patch object. `null` if patch is not necessary.
 */
ydn.crm.sugar.model.Field.prototype.patch = function(value) {
  if (this.isCalculated()) {
    return null;
  }
  if (value == this.getFieldValue()) {
    return null;
  }
  var obj = {};
  obj[this.field_name] = value;
  return obj;
};
