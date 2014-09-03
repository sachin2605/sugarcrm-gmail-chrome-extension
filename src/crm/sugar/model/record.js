// Copyright 2014 YDN Authors. All Rights Reserved.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Lesser General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
//    This program is distributed in the hope that it will be useful,
//    but WITHOUT ANY WARRANTY; without even the implied warranty of
//    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//    GNU Lesser General Public License for more details.
//
// You should have received a copy of the GNU Lesser General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.


/**
 * @fileoverview SugarCRM module model.
 *
 * Encapsulate module info (or meta data) and its transient record entry data.
 * Record entry data can change during life time of the model dispatching
 * change (goog.events.EventType.CHANGE) event.
 */


goog.provide('ydn.crm.sugar.model.Record');
goog.require('ydn.crm.sugar.Record');
goog.require('ydn.crm.sugar.model.AddressGroup');
goog.require('ydn.crm.sugar.model.EmailGroup');
goog.require('ydn.crm.sugar.model.Group');
goog.require('ydn.crm.sugar.model.NameGroup');
goog.require('ydn.crm.sugar.model.PhoneGroup');
goog.require('ydn.msg');



/**
 * SugarCRM module model.
 * @param {ydn.crm.sugar.model.Sugar} parent
 * @param {!ydn.crm.sugar.Record} r
 * @constructor
 * @extends {goog.events.EventTarget}
 * @struct
 * @suppress {checkStructDictInheritance} suppress closure-library code.
 */
ydn.crm.sugar.model.Record = function(parent, r) {
  goog.base(this);
  /**
   * @final
   * @type {ydn.crm.sugar.model.Sugar}
   */
  this.parent = parent;
  /**
   * @type {!ydn.crm.sugar.Record}
   * @protected
   */
  this.record = r;
  /**
   * @type {Object.<!ydn.crm.sugar.model.BaseGroup>}
   * @private
   */
  this.groups_ = {};

  if (ydn.crm.sugar.model.Record.DEBUG) {
    this.randomId_ = Math.random();
  }
};
goog.inherits(ydn.crm.sugar.model.Record, goog.events.EventTarget);


/**
 * @define {boolean} debug flag.
 */
ydn.crm.sugar.model.Record.DEBUG = false;


/**
 * @protected
 * @type {goog.debug.Logger}
 */
ydn.crm.sugar.model.Record.prototype.logger =
    goog.log.getLogger('ydn.crm.sugar.model.Record');


/**
 * @return {string}
 */
ydn.crm.sugar.model.Record.prototype.getDomain = function() {
  return this.parent.getDomain();
};


/**
 * Get record id.
 * @return {string}
 */
ydn.crm.sugar.model.Record.prototype.getId = function() {
  return this.record.getId();
};


/**
 * Get record field value.
 * Note: Newer bean format many return as Object or array of Objects.
 * @param {string} name field name
 * @return {?string}
 */
ydn.crm.sugar.model.Record.prototype.value = function(name) {
  return this.record.value(name);
};


/**
 * Get record title.
 * @return {string}
 */
ydn.crm.sugar.model.Record.prototype.getLabel = function() {
  return this.record.hasRecord() ? this.record.getLabel() : '';
};


/**
 * SugarCRM instance.
 * @return {ydn.crm.sugar.model.Sugar}
 */
ydn.crm.sugar.model.Record.prototype.getSugar = function() {
  return this.parent;
};


/**
 * @return {ydn.crm.sugar.ModuleName}
 */
ydn.crm.sugar.model.Record.prototype.getModuleName = function() {
  return this.record.getModule();
};


/**
 * @return {SugarCrm.ModuleInfo}
 */
ydn.crm.sugar.model.Record.prototype.getModuleInfo = function() {
  return this.parent.getModuleInfo(this.getModuleName());
};


/**
 * @return {boolean} return true if the module is a primary module.
 */
ydn.crm.sugar.model.Record.prototype.isPrimary = function() {
  return ydn.crm.sugar.PRIMARY_MODULES.indexOf(this.getModuleName()) >= 0;
};


/**
 * @return {boolean} return true if the module represent a people.
 */
ydn.crm.sugar.model.Record.prototype.isPeople = function() {
  return ydn.crm.sugar.PEOPLE_MODULES.indexOf(this.getModuleName()) >= 0;
};


/**
 * @return {boolean} return true if the module represent a people.
 */
ydn.crm.sugar.model.Record.prototype.isEditable = function() {
  return ydn.crm.sugar.EDITABLE_MODULES.indexOf(this.getModuleName()) >= 0;
};


/**
 * @return {boolean} check simple module
 */
ydn.crm.sugar.model.Record.prototype.isSimple = function() {
  return ydn.crm.sugar.SIMPLE_MODULES.indexOf(this.getModuleName()) >= 0;
};


/**
 * @param {string} name field name.
 * @return {SugarCrm.ModuleField}
 */
ydn.crm.sugar.model.Record.prototype.getFieldInfo = function(name) {
  var info = this.getModuleInfo();
  return info.module_fields[name];
};


/**
 * @return {ydn.msg.Channel}
 */
ydn.crm.sugar.model.Record.prototype.getChannel = function() {
  return this.parent.getChannel();
};


/**
 * Save the record.
 * @param {SugarCrm.Record} obj
 * @return {!goog.async.Deferred}
 */
ydn.crm.sugar.model.Record.prototype.save = function(obj) {
  var record = new ydn.crm.sugar.Record(this.getDomain(), this.getModuleName(), obj);

  return this.parent.saveRecord(record).addCallback(function(x) {
    var v = /** @type {SugarCrm.Record} */ (x);
    this.updateRecord_(v);
  }, this);

};


/**
 * Update record data.
 * @param {SugarCrm.Record} patch
 * @private
 */
ydn.crm.sugar.model.Record.prototype.updateRecord_ = function(patch) {
  var old_id = this.record.hasRecord() ? this.record.getId() : null;
  this.record.updateData(patch);
  if (this.record.hasRecord()) {
    if (goog.isDefAndNotNull(patch.id)) {
      goog.asserts.assert(patch.id == this.getId(), 'updating record must ' +
          'not change id, from ' + this.getId() + ' to ' + patch.id);
    }
    this.dispatchEvent(new ydn.crm.sugar.model.events.RecordUpdatedEvent());
  } else {
    goog.asserts.assertString(patch.id, 'Id require for updating null record');
    this.dispatchEvent(new ydn.crm.sugar.model.events.RecordChangeEvent(null));
  }
};


/**
 * Patch record to server.
 * @param {Object} patches
 * @return {!goog.async.Deferred}
 */
ydn.crm.sugar.model.Record.prototype.patch = function(patches) {
  if (!patches || Object.keys(patches) == 0) {
    return goog.async.Deferred.succeed(false);
  }
  var obj = ydn.object.clone(this.record.getData());
  for (var key in patches) {
    obj[key] = patches[key];
  }
  var record = new ydn.crm.sugar.Record(this.getDomain(), this.getModuleName(), obj);

  return this.parent.saveRecord(record).addCallback(function(x) {
    var me = this;
    var v = /** @type {SugarCrm.Record} */ (x);
    this.updateRecord_(v);
  }, this);
};


/**
 * @override
 * @protected
 */
ydn.crm.sugar.model.Record.prototype.disposeInternal = function() {
  goog.base(this, 'disposeInternal');
  this.groups_ = null;
};


/**
 * Get sugar crm view link.
 * @return {?string} null if record is not set.
 */
ydn.crm.sugar.model.Record.prototype.getViewLink = function() {
  if (this.record.hasRecord()) {
    return this.parent.getRecordViewLink(this.getModuleName(), this.getId());
  } else {
    return null;
  }
};


/**
 * @return {?SugarCrm.Record} get clone data.
 */
ydn.crm.sugar.model.Record.prototype.getRecordValue = function() {
  return this.record ? /** @type {SugarCrm.Record} */ (/** @type {Object} */ (
      ydn.object.clone(this.record.getData()))) : null;
};


/**
 * Set sugarcrm record. This will dispatch ModuleRecordChangeEvent or
 * ModuleRecordUpdatedEvent.
 * @param {ydn.crm.sugar.Record} record sugarcrm record entry.
 */
ydn.crm.sugar.model.Record.prototype.setRecord = function(record) {

  if (ydn.crm.sugar.model.Record.DEBUG) {
    window.console.log('setRecord ' + this.record + ' to ' + record);
  }
  if (record == this.record) {
    // what if underlying data are different.
    return;
  } else if (!record) {
    if (this.record.hasRecord()) {
      this.record.setData(null);
      this.dispatchEvent(new ydn.crm.sugar.model.events.RecordChangeEvent(null, this));
    }
  } else if (record.getModule() != this.record.getModule()) {
    var old_module = this.record.getModule();
    this.record = record;
    this.dispatchEvent(new ydn.crm.sugar.model.events.ModuleChangeEvent(old_module,
        this));
  } else if (!record.hasRecord()) {
    if (this.record.hasRecord()) {
      var old_id = this.record.getId();
      this.record = record;
      this.dispatchEvent(new ydn.crm.sugar.model.events.RecordChangeEvent(old_id, this));
    }
  } else if (!this.record.hasRecord()) {
    if (record.hasRecord()) {
      this.record = record;
      this.dispatchEvent(new ydn.crm.sugar.model.events.RecordChangeEvent(null, this));
    }
  } else if (record.getId() != this.record.getId()) {
    var old_id = this.record.getId();
    this.record = record;
    this.dispatchEvent(new ydn.crm.sugar.model.events.RecordChangeEvent(old_id, this));
  } else {
    this.record = record;
    this.dispatchEvent(new ydn.crm.sugar.model.events.RecordUpdatedEvent(this));
  }
};


/**
 * @return {boolean}
 */
ydn.crm.sugar.model.Record.prototype.hasRecord = function() {
  return this.record.hasRecord();
};


/**
 * Get list of group name in this module.
 * @return {Array.<string>}
 */
ydn.crm.sugar.model.Record.prototype.listGroups = function() {
  var groups = [];
  var module_info = this.getModuleInfo();
  for (var name in module_info.module_fields) {
    var field = module_info.module_fields[name];
    var group = field.group;
    if (groups.indexOf(group) == -1) {
      groups.push(group);
    }
  }
  return groups;
};


/**
 * Create a new field model if the field present in the record.
 * @param {string} name
 * @return {!ydn.crm.sugar.model.BaseGroup}
 */
ydn.crm.sugar.model.Record.prototype.getGroupModel = function(name) {
  if (!this.groups_[name]) {
    if (name == 'name') {
      this.groups_[name] = new ydn.crm.sugar.model.NameGroup(this);
    } else if (['address', 'alt_address', 'primary_address'].indexOf(name) >= 0) {
      this.groups_[name] = new ydn.crm.sugar.model.AddressGroup(this, name);
    } else if (name == 'email') {
      this.groups_[name] = new ydn.crm.sugar.model.EmailGroup(this);
    } else if (name == 'phone') {
      this.groups_[name] = new ydn.crm.sugar.model.PhoneGroup(this);
    } else {
      this.groups_[name] = new ydn.crm.sugar.model.Group(this, name);
    }
  }
  return this.groups_[name];
};


/**
 * @return {?SugarCrm.Record} get clone of underlying data.
 */
ydn.crm.sugar.model.Record.prototype.cloneData = function() {
  return ydn.object.clone(this.record.getData());
};



if (goog.DEBUG) {
  /**
   * @inheritDoc
   */
  ydn.crm.sugar.model.Record.prototype.toString = function() {
    var s = 'ydn.crm.sugar.model.Record:' + this.record;
    if (ydn.crm.sugar.model.Record.DEBUG) {
      s += String(this.randomId_);
    }
    return s;
  };
}
