﻿/// <reference path="../../client/smartJs/sj.js" />
/// <reference path="../../client/smartJs/sj-error.js" />
/// <reference path="../../client/smartJs/sj-core.js" />
/// <reference path="../qunit/qunit-1.23.0.js" />
'use strict';

QUnit.module("sj-core.js");

QUnit.test("SmartJs.Core", function (assert) {

	var compatible = SmartJs.isBrowserCompatible();
	assert.ok(compatible.result, "browser compatibility check");

	var x = SmartJs.getNewId(), y = SmartJs.getNewId();
	assert.ok(x != y, "unique ids");

	var js398378 = SmartJs.Core.Component;
	var $Component = function () { return new js398378(); }
	var x = $Component();
	assert.ok(x instanceof SmartJs.Core.Component, "shortcut instance test");
	assert.equal(x.objClassName, "Component", "shortcut objClassName test");
});


QUnit.test("SmartJs.Core.String", function (assert) {

	var s = new SmartJs.Core.String("test1: {0}", "x");
	assert.equal(s.toString(), "test1: x", "single replacement");
	s = new SmartJs.Core.String("test1: {0}", "x", 1, 123);
	assert.equal(s.toString(), "test1: x", "single replacement, multiple arguments");
	s = new SmartJs.Core.String("test1: ", "x", 1, 123);
	assert.equal(s.toString(), "test1: ", "no replacement, multiple arguments");
	s = new SmartJs.Core.String("test1: ");
	assert.equal(s.toString(), "test1: ", "no replacement, no arguments");
	s = new SmartJs.Core.String("test1: {0}, test2: {1}, test3: {2}", "x", 1, 123);
	assert.equal(s.toString(), "test1: x, test2: 1, test3: 123", "multiple replacements");
	s = new SmartJs.Core.String("test1: {0}, test1: {0}, test3: {2}", "x", 1, 123);
	assert.equal(s.toString(), "test1: x, test1: x, test3: 123", "multiple replacements with same argument");

	assert.throws(function () { var x = new SmartJs.Core.String(); }, "ERROR: invalid constructor: missing");
	assert.throws(function () { var x = new SmartJs.Core.String(1); }, "ERROR: invalid constructor: !string");
	s = new SmartJs.Core.String("test1: {0}, test2: {1}, test3: {2}", "x", 1);
	assert.throws(function () { s.toString(); }, "ERROR: missing argument");

	//advanced tests
	s = new SmartJs.Core.String("test1: {0}, test2: {1}, test3: {2}", "x", 1, new SmartJs.Core.String("test1: {0}", "y"));
	assert.equal(s.toString(), "test1: x, test2: 1, test3: test1: y", "replace with another String: recursive parse");

});


QUnit.test("SmartJs.Core.Component", function (assert) {

	//objClassName
	var a = new SmartJs.Core.Component();
	assert.equal(a.objClassName, "Component", "SmartJs.Core.Component objClassName");

	var ns = {};
	ns.X = (function () {
		X.extends(SmartJs.Core.Component);

		function X() {
			this.prop1 = "asd";
			this.prop1_ = "asd";
		}
		//X.prototype.merge({
		//    dispose: function () {
		//        this._dispose();
		//        Object.getPrototypeOf(this).dispose();
		//        //SmartJs.Core.Component.prototype.dispose.call(this);
		//    },
		//});

		return X;
	})();

	ns.Y = (function () {
		Y.extends(ns.X);

		function Y() {
			ns.X.call(this);
			this.prop1_ = "jkl";
			this.prop2 = [1, 2, 3, new Array(4, 5, "asd")];
		}
		//Y.prototype.merge({
		//    dispose: function () {
		//        this._dispose();
		//        Object.getPrototypeOf(this).dispose();
		//        //ns.X.prototype.dispose.call(this);
		//    },
		//});
		return Y;
	})();

	var b = new ns.X();
	assert.equal(b.objClassName, "X", "objClassName using inheritance");

	var c = new ns.Y();
	assert.equal(c.objClassName, "Y", "objClassName using multiple inheritance");
	assert.equal(c.prop1_, "jkl", "constructor call hierarchy");

	assert.ok(c instanceof SmartJs.Core.Component && c instanceof ns.X && c instanceof ns.Y, "instance check");

	//assert.throws(function () { c.objClassName = "write protected"; }, Error, "ERROR: writing objClassName");
	//^^ trying to write a write protected property will not throw an error on IE9
	try {
		c.objClassName = "write protected";
	}
	catch (e) { }
	assert.equal(c.objClassName, "Y", "write-protected setter");

	//dispose
	a = new SmartJs.Core.Component();
	a.dispose();
	assert.equal(a._id, undefined, "object disposed: id = undefined");
	assert.equal(a._disposed, true, "object disposed: _disposed = true");
	assert.equal(a.objClassName, "Component", "className after dispose");
	c = new ns.Y();
	c.dispose();
	assert.equal(c._disposed, true, "object disposed (inheritance): _disposed = true");
	assert.ok(c.prop1 === undefined && c.prop1_ === undefined && c.prop2 === undefined, "object disposed (inheritance): property deleted");

	//prototype ok after calling dispose: added after refactoring dispose using Object.getPrototypeOf
	c = new ns.Y();
	assert.ok(c._disposed !== true, "new object not disposed");
	assert.ok(c.prop1 === "asd" && c.prop1_ === "jkl", "object disposed: prototype intact after dispose (due to prototypes property dispose)");
	assert.deepEqual(c.prop2, [1, 2, 3, new Array(4, 5, "asd")], "object disposed: prototype intact after dispose (2)");

	//check for property dispose: using Object.getPrototypeOf
	ns.PD = (function () {
		Pd.extends(ns.X);

		function Pd() {
			ns.X.call(this);
			this.prop1_ = "jkl";
			this.prop2 = [1, 2, 3, new Array(4, 5, "asd")];
		}

		Object.defineProperties(Pd.prototype, {
			prop: {
				get: function () {
					return this.prop1_;
				},
				//enumerable: false,
				//configurable: true,
			},
		});

		return Pd;
	})();

	ns.Y = (function () {
		Y.extends(ns.PD);

		function Y() {
			ns.X.call(this);
			this.prop1_ = "jkl";
			this.prop2 = [1, 2, 3, new Array(4, 5, "asd")];
		}
		return Y;
	})();

	c = new ns.Y();
	assert.equal(c.prop, "jkl", "inherited property declaration");
	c.dispose();
	assert.equal(c.prop, undefined, "disposed property = undefined");
	c = new ns.Y();
	assert.equal(c.prop, "jkl", "inherited property declaration after prototype dispose- checking properties");


	ns.Y = (function () {
		Z1.extends(ns.X, false);

		function Z1() {
			ns.X.call(this);
			this.prop1 = "jkl";
			this.prop2 = [1, 2, 3, new Array(4, 5, "asd")];
		}
		//Y.prototype.testDispose = function () {
		//    SmartJs.Core.Component.prototype.dispose.call(this);
		//    this.dispose();
		//};
		return Z1;
	})();
	ns.Z = (function () {
		Z2.extends(ns.X, false);

		function Z2() {
			ns.X.call(this);
			this.prop1 = "jkl";
			this.prop2 = [1, 2, 3, new Array(4, 5, "asd")];
		}
		//Y.prototype.testDispose = function () {
		//    SmartJs.Core.Component.prototype.dispose.call(this);
		//    this.dispose();
		//};
		return Z2;
	})();

	c = new ns.Y();
	assert.equal(c.objClassName, "Z1", "objClassName using multiple inheritance (without base constructor call in Object.extends()");

	//merging objects in constructor
	//a = new SmartJs.Core.Component({ _disposed: true });
	//assert.equal(a._disposed, true, "(merging) set property");    //this is the only property
	//^^ property was removed -> this test is done using a uiComponent (have a look at the UiComponents unit tests)

	assert.throws(function () { a = new SmartJs.Core.Component(true); }, Error, "ERROR: (merging) no object");

	assert.throws(function () { a = new SmartJs.Core.Component({ undefined: 23 }); }, Error, "ERROR: (merging) undefined property");

	assert.throws(function () { a = new SmartJs.Core.Component({ dispose: "override" }); }, Error, "ERROR: (merging) write function");

	//assert.throws(function () {
	//	a = new SmartJs.Core.Component({ objClassName: "override" });
	//	a.objClassName = "override";    //to make this test browser compatible
	//}, Error, "ERROR: (merging) internal: set write protected property");

	//^^ IE9 will not throw an error but ignores it
	a = new SmartJs.Core.Component();
	try {
		a = new SmartJs.Core.Component({ objClassName: "override" });
		a.objClassName = "override";
	}
	catch (e) { }
	assert.equal(a.objClassName, "Component", "getting sure value was not set: cross-browser and strict mode issue");

	ns.X = (function () {
		X.extends(SmartJs.Core.Component);

		function X(props) {
			this.prop1 = "asd";
			this.prop2 = 2;
			this.prop3 = { asd: 1 };

			this._mergeProperties(props);
		}
		return X;
	})();

	b = new ns.X({ prop1: 4, prop2: 5, prop3: 6 });
	assert.ok(b.prop1 == 4 && b.prop2 == 5 && b.prop3 == 6, "merging including inherited properties");

	//dispose
	ns.PD = (function () {
		Pd.extends(ns.X);

		function Pd(val1, val2, val3) {
			ns.X.call(this);
			this.prop1_ = "jkl";
			//this.prop2 = [1, 2, 3, new Array(4, 5, "asd")];
			this.val1 = val1;
			this.val2 = val2;
			this.val3 = val3;
		}

		Object.defineProperties(Pd.prototype, {
			prop: {
				get: function () {
					return this.prop1_;
				},
				//enumerable: false,
				//configurable: true,
			},
			prop_2: {
				value: "asd",
				writable: true,
			},
		});

		return Pd;
	})();

	ns.Y = (function () {
		Y.extends(ns.PD, false);

		function Y() {
			ns.PD.call(this, "1", 2);
			this.prop1_ = "jkl";
			this.prop_2 = "initialized";
			//this.prop2 = [1, 2, 3, new Array(4, 5, "asd")];
		}
		return Y;
	})();

	var test = new ns.Y();
	var test2 = new ns.Y();
	assert.ok(test.val1 === "1" && test.val2 === 2 && test.val3 === undefined, "ctr with arguments using superCtor");
	test.dispose();
	assert.ok(test.val1 === undefined && test.val2 === undefined && test.val3 === undefined && test.prop === undefined && test.prop_2 === "asd", "properties cleared correctly during dispose");
	assert.ok(test2.val1 === "1" && test2.val2 === 2 && test2.val3 === undefined, "dispose: not effecting existing other objects");

	var test = new ns.Y();
	assert.ok(test.val1 === "1" && test.val2 === 2 && test.val3 === undefined && test.prop_2 === "initialized", "recreated: ctr with arguments using superCtor");

});


QUnit.test("SmartJs.Core.EventTarget", function (assert) {

	var e = new SmartJs.Core.EventTarget();
	assert.equal(e.objClassName, "EventTarget", "objClassName check");
	assert.ok(e instanceof SmartJs.Core.EventTarget && e instanceof SmartJs.Core.Component && e instanceof Object, "instance check");

	//e = new SmartJs.Core.EventTarget({ _disposed: true });
	//assert.equal(e._disposed, true, "merging constructor properties including inherited properties");  //no property defined to test in EventTarget
	//^^ this tests are defined in ui component 

	var ns = {};
	ns.Y = (function () {
		Y.extends(SmartJs.Core.EventTarget);

		function Y() {
			this._dom = document.getElementById("qunit-fixture");
			this.clicked = false;
			//this._addDomListener(this._dom, "click", this._clickHandler);
			//this.prop1 = "jkl";
			//this.prop2 = [1, 2, 3, new Array(4, 5, "asd")];
		}

		Y.prototype.merge({
			_clickHandler: function (e) {
				this.clicked = true;
				if (e.arg1 == 1 && e.arg2 == 2)
					this.eventArgsReceived = true;
			},
			add: function () { return this._addDomListener(this._dom, "click", this._clickHandler, {arg1:1, arg2:2}); },
			remove: function (handler) { this._removeDomListener(this._dom, "click", handler); },
		});
		//    testDispose = function () {
		//    SmartJs.Core.Component.prototype.dispose.call(this);
		//    this.dispose();
		//};
		return Y;
	})();

	var a = new ns.Y();
	try {
		document.getElementById("qunit-fixture").click();
		assert.equal(a.clicked, false, "click event before adding");
	}
	catch (e) { assert.ok(true, "PLACEHOLDER: test not supported"); }

	var handler = a.add();
	try {
		document.getElementById("qunit-fixture").click();
		assert.equal(a.clicked, true, "added and executed");
		assert.ok(a.eventArgsReceived, "individual event arguments attached");
	}
	catch (e) { assert.ok(true, "PLACEHOLDER: test not supported"); }

	a.clicked = false;
	a.remove(handler);
	try {
		document.getElementById("qunit-fixture").click();
		assert.equal(a.clicked, false, "handler removed");
	}
	catch (e) { assert.ok(true, "PLACEHOLDER: test not supported"); }

	var e = document.createEvent("MouseEvents");
	e.initEvent("click", false, true);

	handler = a.add();
	document.getElementById("qunit-fixture").dispatchEvent(e);
	assert.equal(a.clicked, true, "added and executed using dispatchEvent");

	a.clicked = false;
	a.remove(handler);
	document.getElementById("qunit-fixture").dispatchEvent(e);
	assert.equal(a.clicked, false, "handler removed");

});


/*
		switch (eventName) {
			case "click": // Dispatching of 'click' appears to not work correctly in Safari. Use 'mousedown' or 'mouseup' instead.
			case "mousedown":
			case "mouseup":
				eventClass = "MouseEvents";
				break;

			case "focus":
			case "change":
			case "blur":
			case "select":
				eventClass = "HTMLEvents";
				break;

			default:
				throw "fireEvent: Couldn't find an event class for event '" + eventName + "'.";
				break;
		}*/

//http://stackoverflow.com/questions/2381572/how-can-i-trigger-a-javascript-event-click
//simulating events during unit tests


