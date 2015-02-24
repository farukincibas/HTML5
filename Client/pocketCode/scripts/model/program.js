﻿/// <reference path="../../../smartJs/sj.js" />
/// <reference path="../../../smartJs/sj-event.js" />
/// <reference path="../core.js" />
/// <reference path="broadcastManager.js" />
'use strict';

PocketCode.Model.Program = (function () {

	function Program() {
		this._running = false;
		this._paused = false;

		this.id = undefined;
		this.title = "";
		this.description = "";
		this.author = "";

		this.background = undefined;
		this.sprites = [];

		this.resourceBaseUrl = "";
		this._images = {};
		this._sounds = {};
		this._variables = {};

		this._broadcasts = [];
		this._broadcastMgr = new PocketCode.BroadcastManager(this._broadcasts);

		//events
		this._onProgramStart = new SmartJs.Event.Event(this);
		this._onExecuted = new SmartJs.Event.Event(this);
		this._onTabbedAction = new SmartJs.Event.Event(this);
	}

	//properties
	Object.defineProperties(Program.prototype, {
	    images: {
	        set: function (images) {
	            if (!(images instanceof Array))
	                throw new Error('setter expects type Array');

	            for (i = 0, l = images.length; i < l; i++)
	                this._images[images[i].id] = images[i];
	        },
	        //enumerable: false,
	        //configurable: true,
	    },
	    sounds: {
	        set: function (sounds) {
	            if (!(sounds instanceof Array))
	                throw new Error('setter expects type Array');

	            for (i = 0, l = sounds.length; i < l; i++)
	                this._sounds[sounds[i].id] = sounds[i];
	        },
	        //enumerable: false,
	        //configurable: true,
	    },
	    variables: {
	        set: function (variables) {
	            if (!(variables instanceof Array))
	                throw new Error('setter expects type Array');

	            for (i = 0, l = variables.length; i < l; i++) {
	                varArray[i].value = 0;  //init
	                this._variables[variables[i].id] = variables[i];
	            }
	        },
	        //enumerable: false,
	        //configurable: true,
	    },
	    broadcasts: {
	        set: function (broadcasts) {
	            if (!(broadcasts instanceof Array))
	                throw new Error('setter expects type Array');

	            //for (i = 0, l = broadcasts.length; i < l; i++)
	            //    this._broadcasts[broadcasts[i].id] = broadcasts[i];
	            this._broadcasts = broadcasts;
	            this._broadcastMgr.init(broadcasts);
	        },
	        //enumerable: false,
	        //configurable: true,
	    },
	});

	//events
	Object.defineProperties(Program.prototype, {
		onProgramStart: {
			get: function () { return this._onProgramStart; },
			//enumerable: false,
			//configurable: true,
		},
		onExecuted: {
			get: function () { return this._onExecuted; },
			//enumerable: false,
			//configurable: true,
		},
		onTabbedAction: {
			get: function () { return this._onTabbedAction; },
			//enumerable: false,
			//configurable: true,
		},
	});
		
	//methods
	Program.prototype.merge({
		start: function () {
			if (this._running)
				return;
			if (!this.background && this.sprites.length === 0)
				throw new Error('no program loaded');

			for (var i = 0, l = this.sprites.length; i < l; i++) {
				this.sprites[i].start();
			}
			this.onProgramStart.dispatchEvent();
		},
		restart: function () {
			this.stop();
			this.start();
		},
		pause: function () {
			if (!this._running || this._paused)
				return;

			this.background.pause();

			for (var i = 0, l = this.sprites.length; i < l; i++) {
				this.sprites[i].pause();
			}
			this._paused = true;
		},
		resume: function () {
			if (!this._paused)
				return;

			this.background.resume();

			for (var i = 0, l = this.sprites.length; i < l; i++) {
				this.sprites[i].resume();
			}
			this._paused = false;
		},
		stop: function () {
			this.background.stop();

			for (var i = 0, l = this.sprites.length; i < l; i++) {
				this.sprites[i].stop();
			}
			this._running = false;
			this._paused = false;
		},

		_spriteOnExecudedHandler: function(e) {
			//TODO: add handler to sprites on init
			//check all sprites if running
			//dispatch program.onExecuted event
		},

		getSprite: function (spriteId) {
			//todo implement this
		},
		getSpriteLayer: function (spriteId) {
			//todo implement this
		},

		getGlobalVariable: function (varId) {
		    if (this._variables[varId])
		        return this._variables[varId];
		    else
		        throw new Error('unknown variable id: ' + varId);
		},
		getGlobalVariableNames: function () {
		    var variables = {};
		    //TODO: id: {name: ?, type: [local/global]}
		    return variables;
		}
	    //setGlobalVariable: function (varId, value) {
		//    if (this._variables[varId])
		//        return this._variables[varId].value = value;
		//    else
		//        throw new Error('unknown variable id: ' + varId);
		//},
	});

	return Program;
})();