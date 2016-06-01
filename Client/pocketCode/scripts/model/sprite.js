/// <reference path="../../../smartJs/sj.js" />
/// <reference path="../../../smartJs/sj-core.js" />
/// <reference path="../../../smartJs/sj-event.js" />
/// <reference path="../core.js" />
/// <reference path="userVariableHost.js" />
/// <reference path="gameEngine.js" />
'use strict';

/**
 * RotationStyles
 * @type {{DO_NOT_ROTATE: string, LEFT_TO_RIGHT: string, ALL_AROUND: string}}
 */
PocketCode.RotationStyle = {
    DO_NOT_ROTATE: 'don\'t rotate',
    LEFT_TO_RIGHT: 'left-right',
    ALL_AROUND: 'all around',
};

/**
 * GraphicEffects
 * @type {{COLOR: string, FISHEYE: string, WHIRL: string, PIXELATE: string, MOSAIC: string, BRIGHTNESS: string, GHOST: string}}
 */
PocketCode.GraphicEffect = {
    COLOR: 'color',
    FISHEYE: 'fisheye',
    WHIRL: 'whirl',
    PIXELATE: 'pixelate',
    MOSAIC: 'mosaic',
    BRIGHTNESS: 'brightness',
    GHOST: 'ghost',     //opacity, transparency
};

PocketCode.Model.Sprite = (function () {
    Sprite.extends(PocketCode.UserVariableHost, false);

    /**
     * initialization of properties
     * @param gameEngine gameEngine instance as a reference
     * @param propObject object which can contains properties
     */
    function Sprite(gameEngine, propObject) {
        PocketCode.UserVariableHost.call(this, PocketCode.UserVariableScope.LOCAL, gameEngine);
        this._gameEngine = gameEngine;
        this._onChange = gameEngine.onSpriteUiChange;    //mapping event (defined in gameEngine)
        //this._onVariableChange = gameEngine._onVariableChange;
        this._onVariableChange.addEventListener(new SmartJs.Event.EventListener(function (e) { this._gameEngine.onVariableUiChange.dispatchEvent(e); }, this));
        //this._executionState = PocketCode.ExecutionState.STOPPED;

        this.name = '';
        //this._isClone = false;

        this._looks = [];
        this._lookOffsetX = 0.0;
        this._lookOffsetY = 0.0;
        this._sounds = [];
        this._scripts = [];

        //attach to scripts onExecuted event, get sure all are executed and not running
        //property initialization

        ////motion: set in init()
        this._positionX = 0.0;
        this._positionY = 0.0;
        this._rotationStyle = PocketCode.RotationStyle.ALL_AROUND;
        this._direction = 90.0; //pointing to right: 0 means up

        ////sounds: currently not in use but defined: in future: change name + serialization required
        ////looks
        this._currentLook = undefined;
        //this._size = 100.0;
        this._scaling = 1.0;
        this._visible = true;
        this._transparency = 0.0;
        this._brightness = 100.0;
        this._colorEffect = 0.0;

        //events
        this._onExecuted = new SmartJs.Event.Event(this);

        if (!propObject || !propObject.id)// || !propObject.name)
            throw new Error('missing ctr arguments: id and/or name in sprite');

        //this._mergeProperties(propObject);
        this._id = propObject.id;
        this.name = propObject.name || '';

        //looks: a sprite doesn't always have a look
        if (propObject.looks != undefined)
            this.looks = propObject.looks;
        // this.init();
        //sounds
        if (propObject.sounds) {
            this.sounds = propObject.sounds;
        }

        //variables: a sprite may have no (local) variables
        this._variables = propObject.variables || [];
        this._lists = propObject.lists || [];

        //scripts
        if (propObject.scripts) {
            this.scripts = propObject.scripts;
        }
    }

    //properties
    Object.defineProperties(Sprite.prototype, {
        renderingProperties: {   //all rendering propeties as object
            get: function () {
                var obj = {
                    id: this._id,
                    x: this._positionX,
                    y: this._positionY,
                    //direction: this._direction,
                    rotation: this._direction - 90.0,
                    flipX: this._flipX,
                    //rotationStyle: this._rotationStyle,
                    //look: this._currentLook ? this._gameEngine.getLookImage(this._currentLook.imageId) : undefined,
                    scaling: this._scaling,//1,// / this._gameEngine.getLookImage(this._currentLook.imageId).initialScaling,//this._currentLook ? this._size / 100.0 / this._currentLook.initialScaling : 0,
                    visible: this._visible, //this._currentLook ? this._visible : false,
                    graphicEffects: [
                        { effect: PocketCode.GraphicEffect.GHOST, value: this._transparency },
                        { effect: PocketCode.GraphicEffect.BRIGHTNESS, value: this._brightness - 100 },  //send +-100 instead of 0..200
                        { effect: PocketCode.GraphicEffect.COLOR, value: this._colorEffect},
                        //TODO: add other filters as soon as available
                    ],
                };
                if (this._currentLook) {
                    var look = this._currentLook;//this._gameEngine.getLookImage(this._currentLook.imageId);

                    obj.merge({
                        look: look.canvas,
                        scaling: 1.0 / look.initialScaling,
                        x: this._positionX + this._lookOffsetX,//center.length * Math.cos(center.angle),
                        y: this._positionY + this._lookOffsetY,//center.length * Math.sin(center.angle),
                    });
                }
                return obj;
            },
        },
        id: {
            get: function () {
                return this._id;
            },
        },

        //motion
        positionX: {
            get: function () {
                return this._positionX;
            },
        },
        positionY: {
            get: function () {
                return this._positionY;
            },
        },
        direction: {
            get: function () {
                return this._direction;
            },
            //set: function (direction) {
            //    this._direction = direction;
            //},
        },
        layer: {
            //set: function (layer) {
            //TODO: in program : for testing issues
            // this._layer = layer;
            //},
            get: function () {
                return this._gameEngine.getSpriteLayer(this);//.id);
            },
        },
        rotationStyle: {
            get: function () {
                return this._rotationStyle;
            },
            //set: function(value) {
            //    this._rotationStyle = value;
            //    //value: PocketCode.RotationStyle.ALL_AROUND,   //static property (right now)
            //},
        },

        //looks
        looks: {
            set: function (jsonLooks) {
                if (!(jsonLooks instanceof Array))// || looks.length === 0)    //looks === undefined || typeof looks !== 'object' ||
                    throw new Error('invalid argument: expected jsonLooks type of array');

                this._looks = [];
                var look;
                for (var i = 0, l = jsonLooks.length; i < l; i++) {
                    look = new PocketCode.Model.Look(jsonLooks[i]);
                    this._looks.push(look);
                }
                
                if (jsonLooks.length > 0)
                    this._currentLook = this._looks[0];
                else    //make sure its deleted on re-initialize
                    this._currentLook = undefined;
            },
            //get: function () {
            //    return this._looks;
            //},
        },
        currentLook: {
            get: function () {
                return this._currentLook;
            },
        },
        size: {     //percentage
            get: function () {
                return this._scaling * 100.0;//this._size;
            },
        },
        transparency: {
            get: function () {
                return this._transparency;
            },
        },
        brightness: {
            get: function () {
                return this._brightness;
            },
        },
        colorEffect: {
            get: function () {
                return this._colorEffect;
            },
        },

        sounds: {
            set: function (sounds) {
                if (!(sounds instanceof Array))
                    throw new Error('sounds setter expects type Array');

                this._sounds = sounds;
                //var sound;
                //for (var i = 0, l = sounds.length; i < l; i++) {
                //    sound = sounds[i];
                //    this._sounds[sound.id] = sound;
                //}
            },
            //get: function () {
            //    return this._sounds;
            //},
        },

        scripts: {
            set: function (scripts) {
                if (!(scripts instanceof Array))
                    throw new Error('scripts setter expects type Array');
                //for (var i = 0, l = scripts.length; i < l; i++) {
                //    this._scripts.push(this._gameEngine._brickFactory.create(this, scripts[i])); //TODO: brickfactory is PRIVATE
                //}

                var script;
                for (var i = 0, l = scripts.length; i < l; i++) {
                    script = scripts[i];
                    
                    //if (!(script instanceof PocketCode.Model.ScriptBlock))                               //this change breaks our tests: //TODO: 
                    //    throw new Error('invalid script block: every brick has to be inherited from ScriptBlock');
                    if (script.onExecuted)  //supported by all (root container) scripts
                        script.onExecuted.addEventListener(new SmartJs.Event.EventListener(this._scriptOnExecuted, this));
                }
                this._scripts = scripts;
            },
            get: function () {
                return this._scripts;
            },
        },

        visible: {
            get: function () {
                return this._visible;
            },
        },
        scriptsRunning: {
            get: function () {
                var scripts = this._scripts;
                var es;
                for (var i = 0, l = scripts.length; i < l; i++) {
                    es = scripts[i].executionState;
                    if (es == PocketCode.ExecutionState.PAUSED || es == PocketCode.ExecutionState.RUNNING) {
                        return true;
                    }
                }
                return false;
            },
        },
    });

    //events
    Object.defineProperties(Sprite.prototype, {
        /**
         * @event
         * returns the onSpriteUiChange of gameEngine
         */
        //onChange: {
        //    get: function () { return this._gameEngine.onSpriteUiChange; },
        //},
        /**
         * @event
         * indicates whether the sprite finished execution
         */
        onExecuted: {
            get: function () { return this._onExecuted; },
        },
    });

    //methods
    Sprite.prototype.merge({
        init: function () {
            //property initialization
            //motion
            this._positionX = 0.0;
            this._positionY = 0.0;
            this._direction = 90.0; //pointing to right: 0 means up
            this._rotationStyle = PocketCode.RotationStyle.ALL_AROUND;
            this._flipX = false;
            //sounds: currently not in use but defined: in future: change name + serialization required
            //looks
            var looks = this._looks;
            this._currentLook = looks.length > 0 ? looks[0] : undefined;

            //this._size = 100.0;
            this._scaling = 1.0;
            this._visible = true;
            this._transparency = 0.0;
            this._brightness = 100.0;
            this._colorEffect = 0.0;
            this._recalculateLookOffsets();
            //variables
            this._resetVariables();
        },
        initLooks: function() {//initialScaling) {
            var looks = this._looks;
            var l = looks.length,
                look, img;

            for (var i = 0; i < l; i++) {
                look = looks[i];
                img = this._gameEngine.getLookImage(look.imageId);
                look.init(img);//, initialScaling);
            }
        },
        ///**
        // * calls execute() on every script as long as method is available
        // */
        //execute: function() {
        //    for (var i = 0, l = this._scripts.length; i < l; i++) {
        //        if (this._scripts[i].execute) {
        //            this._scripts[i].execute();
        //        }
        //    }
        //    this._executionState =  PocketCode.ExecutionState.RUNNING;
        //},
        /**
         * calls pause() on every script as long as method is available
         */
        pauseScripts: function () {
            var scripts = this._scripts;
            for (var i = 0, l = scripts.length; i < l; i++) {
                if (scripts[i].pause)
                    scripts[i].pause();
            }
            //this._executionState = PocketCode.ExecutionState.PAUSED;
        },
        /**
         * calls resume() on every script as long as method is available
         */
        resumeScripts: function () {
            var scripts = this._scripts;
            for (var i = 0, l = scripts.length; i < l; i++) {
                if (scripts[i].resume)
                    scripts[i].resume();
            }
            //this._executionState = PocketCode.ExecutionState.RUNNING;
        },
        /**
         * calls stop() on every script as long as method is available
         */
        stopScripts: function () {
            var scripts = this._scripts;
            for (var i = 0, l = scripts.length; i < l; i++) {
                if (scripts[i].stop)
                    scripts[i].stop();
            }
            //this._executionState = PocketCode.ExecutionState.STOPPED;
        },
        /**
         * @event handler
         * @private
         */
        _scriptOnExecuted: function (e) {
            if (!this.scriptsRunning) {
                this._onExecuted.dispatchEvent();
            }
        },
        /**
         * @event helper
         * @param properties
         * @private
         */
        _triggerOnChange: function (properties) {
            //var properties = {};
            //for (var i = 0, l = propertyArray.length; i < l; i++) {
            //    properties.merge(propertyArray[i]);
            //}
            this._onChange.dispatchEvent({ id: this._id, properties: properties }, this);
        },

        _recalculateLookOffsets: function() {
            if (!this._currentLook) {
                this._lookOffsetX = 0.0;
                this._lookOffsetY = 0.0;
                return;
            }
            // bypass tests where looks were not loaded via the image store
            //try {
            var look = this._currentLook;//this._gameEngine.getLookImage(this._currentLook.imageId);
            //} catch (err) {console.log('LOOK NOT FOUND, PROBABLY NOT YET LOADED.');return;}

            var rotationAngle = (this._direction - 90.0) * Math.PI / 180.0;
            var center = look.center;///look.center;
            //var scale = this._size / 100.0 / look.initialScaling;   //TODO: delete initial scaling???

            this._lookOffsetX = center.length * this._scaling * Math.cos(center.angle - rotationAngle);
            this._lookOffsetY = center.length * this._scaling * Math.sin(center.angle - rotationAngle);
        },

        _triggerRotationChange: function (rotationStyleChanged) {
            var props = {};
            switch (this._rotationStyle) {
                case PocketCode.RotationStyle.ALL_AROUND:
                    if (this._flipX) {
                        this._flipX = false;
                        props.flipX = false;
                    }
                    props.rotation = this._direction - 90.0;

                    // recalculate x/y position and add them to props
                    // var center = this._gameEngine.getLookImage(this._currentLook.imageId).center;
                    //this._recalculateLookOffsets();
                    props.x = this._positionX + this._lookOffsetX;
                    props.y = this._positionY + this._lookOffsetY;
                    break;
                case PocketCode.RotationStyle.DO_NOT_ROTATE:
                    if (this._flipX) {
                        this._flipX = false;
                        props.flipX = false;
                    }
                    if (rotationStyleChanged && this._direction != 90.0) {
                        props.rotation = 0.0;
                        //recalculate x/y position and add them to props
                        var center = this._currentLook.center;//this._gameEngine.getLookImage(this._currentLook.imageId).center;
                        props.x = this._positionX + this._lookOffsetX; // + center.length * Math.cos(center.angle);// - props.rotation * Math.PI / 180.0);
                        props.y = this._positionY + this._lookOffsetY; // + center.length * Math.sin(center.angle);// - props.rotation * Math.PI / 180.0);
                    }
                    break;
                case PocketCode.RotationStyle.LEFT_TO_RIGHT:
                    var flipX = (this._direction < 0.0);
                    if (this._flipX != flipX) {
                        this._flipX = flipX;
                        props.flipX = flipX;
                    }
                    if (rotationStyleChanged) {
                        props.rotation = 0.0;
                        //recalculate x/y position and add them to props
                        var center = this._currentLook.center;//this._gameEngine.getLookImage(this._currentLook.imageId).center;
                        props.x = this._positionX + this._lookOffsetX; // + center.length * Math.cos(center.angle);// - props.rotation * Math.PI / 180.0);
                        props.y = this._positionY + this._lookOffsetY; // + center.length * Math.sin(center.angle);// - props.rotation * Math.PI / 180.0);
                    }
                    break;
            }
            this._onChange.dispatchEvent({ id: this._id, properties: props }, this);
        },

        //motion: position
        /**
         * sets the position(x,y) of the sprite
         * @param {number} x
         * @param {number} y
         * @param {boolean} triggerEvent
         * @returns {boolean}
         */
        setPosition: function (x, y, triggerEvent) {
            if (isNaN(x) || isNaN(y))
                throw new Error('invalid argument: position');
            if (this._positionX === x && this._positionY === y)
                return false;

            var ops = {};//,
                //center = { length: 0, angle: 0 };
            //if (this._currentLook)
            //    center = this._gameEngine.getLookImage(this._currentLook.imageId).center;
            //var angle = center.angle;
            //if (this._rotationStyle === PocketCode.RotationStyle.ALL_AROUND)
            //    angle -= (this._direction - 90.0) * Math.PI / 180.0;

            if (this._positionX != x) {
                this._positionX = x;
                ops.x = x + this._lookOffsetX; //center.length * Math.cos(angle);
            }
            if (this._positionY != y) {
                this._positionY = y;
                ops.y = y + this._lookOffsetY; //center.length * Math.sin(angle);
            }

            if (ops.x !== undefined || ops.y !== undefined) {
                if (triggerEvent !== false) {// && center) {
                    this._triggerOnChange(ops);
                }
                return true;
            }
            return false;
        },
        /**
         * sets the x position of the sprite
         * @param {number} x
         * @returns {boolean}
         */
        setPositionX: function (x) {
            if (isNaN(x))
                throw new Error('invalid argument: position');
            if (this._positionX === x)
                return false;

            //var center = { length: 0, angle: 0 };
            //if (this._currentLook)
            //    center = this._gameEngine.getLookImage(this._currentLook.imageId).center;
            //var angle = center.angle;
            //if (this._rotationStyle === PocketCode.RotationStyle.ALL_AROUND)
            //    angle -= (this._direction - 90.0) * Math.PI / 180.0;
            this._positionX = x;
            this._triggerOnChange({ x: x + this._lookOffsetX });//center.angle - (this._direction - 90.0) * Math.PI / 180.0) });
            return true;
        },
        /**
         * changes the x position of the sprite by a value
         * @param {number} value
         * @returns {boolean}
         */
        changePositionX: function (value) {
            if (isNaN(value))
                throw new Error('invalid argument: position');
            if (!value)// || value === 0)
                return false;
            //var center = { length: 0, angle: 0 };
            //if (this._currentLook)
            //    center = this._gameEngine.getLookImage(this._currentLook.imageId).center;
            //var angle = center.angle;
            //if (this._rotationStyle === PocketCode.RotationStyle.ALL_AROUND)
            //    angle -= (this._direction - 90.0) * Math.PI / 180.0;

            this._positionX += value;
            this._triggerOnChange({ x: this._positionX + this._lookOffsetX });//center.angle - (this._direction - 90.0) * Math.PI / 180.0) });
            return true;
        },
        /**
         * sets the y position of the sprite
         * @param {number} y
         * @returns {boolean}
         */
        setPositionY: function (y) {
            if (isNaN(y))
                throw new Error('invalid argument: position');
            if (this._positionY === y)
                return false;

            var center = { length: 0, angle: 0 };
            //if (this._currentLook)
            //    center = this._gameEngine.getLookImage(this._currentLook.imageId).center;
            //var angle = center.angle;
            //if (this._rotationStyle === PocketCode.RotationStyle.ALL_AROUND)
            //    angle -= (this._direction - 90.0) * Math.PI / 180.0;
            this._positionY = y;
            this._triggerOnChange({ y: y + this._lookOffsetY });//center.angle - (this._direction - 90.0) * Math.PI / 180.0) });
            return true;
        },
        /**
         * changes the y position of the sprite by a value
         * @param {number} value
         * @returns {boolean}
         */
        changePositionY: function (value) {
            if (isNaN(value))
                throw new Error('invalid argument: position');
            if (!value)// || value === 0)
                return false;

            var center = { length: 0, angle: 0 };
            //if (this._currentLook)
            //    center = this._gameEngine.getLookImage(this._currentLook.imageId).center;
            //var angle = center.angle;
            //if (this._rotationStyle === PocketCode.RotationStyle.ALL_AROUND)
            //    angle -= (this._direction - 90.0) * Math.PI / 180.0;
            this._positionY += value;
            this._triggerOnChange({ y: this._positionY + this._lookOffsetY});//center.angle - (this._direction - 90.0) * Math.PI / 180.0) });
            return true;
        },
        /**
         * moves the sprite "value" steps in the direction of the current direction
         * @param {number} steps
         * @returns {boolean}
         */
        move: function (steps) {
            if (!steps)// || steps === 0)
                return false;

            var rad = (90.0 - this._direction) * (Math.PI / 180.0);
            var offsetX = +(Math.cos(rad) * steps).toFixed(4);//Math.round(Math.cos(rad) * steps);
            var offsetY = +(Math.sin(rad) * steps).toFixed(4);//Math.round(Math.sin(rad) * steps);
            //var triggerEvent;

            return this.setPosition(this._positionX + offsetX, this._positionY + offsetY);//, triggerEvent);
            //return true;
        },

        //motion:direction
        /**
         * turns the sprite "value" degree left
         * @param {number} degree
         * @returns {*}
         */
        turnLeft: function (degree) {
            if (!degree)
                return false;
            return this.setDirection(this._direction - degree);
        },
        /**
         * turns the sprite "value" degree right
         * @param degree
         * @returns {boolean}
         */
        turnRight: function (degree) {
            if (!degree)
                return false;
            return this.setDirection(this._direction + degree);
            //var d = this._direction;
            //var nd = (d + degree) % 360.0;
            //if (nd <= -180.0) {
            //    nd += 360.0;
            //}
            //if (nd > 180.0) {
            //    nd -= 360.0;
            //}
            //if (d === nd)
            //    return false;

            //this._direction = nd;
            //this._triggerRotationChange();//{ rotation: nd - 90.0 });
            //return true;
        },
        /**
         * sets the direction of the sprite to degree value
         * @param {number} degree
         * @param triggerEvent
         * @returns {boolean}
         */
        setDirection: function (degree, triggerEvent) {
            if (degree === undefined || this._direction === degree)
                return false;

            var nd = degree % 360.0;
            if (nd <= -180.0) {
                nd += 360.0;
            }
            if (nd > 180.0) {
                nd -= 360.0;
            }
            if (this._direction === nd)
                return false;

            this._direction = nd;
            if (triggerEvent !== false || this._rotationStyle == PocketCode.RotationStyle.ALL_AROUND)
                this._recalculateLookOffsets();
            if (triggerEvent !== false)
                this._triggerRotationChange();//{ rotation: degree - 90.0 });
            return true;
        },
        /**
         * sets the direction of current sprite so that it points to a given sprite
         * @param spriteId
         * @returns {boolean}
         */
        pointTo: function (spriteId) {
            if (!spriteId)
                return false;

            var pointTo = this._gameEngine.getSpriteById(spriteId);
            //if (pointTo == undefined) //-> will throw an error in getSpriteById()
            //    return false;

            var offsetX = pointTo.positionX - this.positionX;
            var offsetY = pointTo.positionY - this.positionY;

            if (offsetX === 0 && offsetY === 0)
                return false;

            //var direction = 90.0 - Math.atan2(offsetY, offsetX) * (180.0 / Math.PI);
            return this.setDirection(90.0 - Math.atan2(offsetY, offsetX) * (180.0 / Math.PI));
            //if (this._direction == direction)
            //    return false;

            //this._direction = direction;
            //this._triggerRotationChange();//{ rotation: direction - 90.0 });
            //return true;
        },
        //motion: layer
        /**
         * sets the sprite "value" layers back
         * @param {number} layers
         * @returns {*}
         */
        goBack: function (layers) {
            return this._gameEngine.setSpriteLayerBack(this, layers);//.id, layers);
            //onChange event is triggered by program in this case
        },
        /**
         * sets the layer of the sprite to the foremost one
         * @returns {*}
         */
        comeToFront: function () {
            return this._gameEngine.setSpriteLayerToFront(this);//.id);
            //onChange event is triggered by program in this case
        },
        /**
         * sets the rotation style of the sprite (enum value)
         * @returns {*}
         */
        setRotationStyle: function (value) {
            if (this._rotationStyle == value)
                return false;

            this._rotationStyle = value;
            //this._recalculateLookOffsets();
            this._triggerRotationChange(true);//{ rotationStyle: this._rotationStyle });
            return true;
        },
        //looks
        /**
         * sets the look of the sprite
         * @param lookId
         * @returns {boolean}
         */
        setLook: function (lookId) {
            if (this._currentLook && this._currentLook.id === lookId || this._looks.length == 0)
                return false;
            
            var looks = this._looks,
                look, update;
            //var look, center, update, angle;
            for (var i = 0, l = looks.length; i < l; i++) {
                look = looks[i];
                if (looks.id === lookId) {
                    this._currentLook = look;
            //        look = this._gameEngine.getLookImage(look.imageId);     //TODO: include in look object
                    update = { look: look.canvas };
            //        center = look.center;
                    this._recalculateLookOffsets();
            //        // angle = (this._rotationStyle === PocketCode.RotationStyle.ALL_AROUND) ? center.angle - (this._direction - 90.0) * Math.PI / 180.0 : center.angle;
                    update.x = this._positionX + this._lookOffsetX;
                    update.y = this._positionY + this._lookOffsetY;
                    this._triggerOnChange(update);
                    return true;
                }
            }
            //var look = this._looks[lookId];
            //if (look)   //exists
            //    this._currentLook = look;
            //else
            throw new Error('look image with id ' + lookId + ' could not be found');
        },
        /**
         * sets the current look of the sprite to the next one in the list
         * @returns {boolean}
         */
        nextLook: function () {
            if (this._currentLook == undefined || this._looks.length == 0)
                return false;

            var looks = this._looks,
                update;
            var count = looks.length;
            if (count < 2)
                return false;
            //var look, center, update, angle;
            for (var i = 0; i < count; i++) {
                if (this._currentLook === looks[i]) {
                    if ((i + 1) < count) {  //1+1=2 < 2    2<2
                        var j = i + 1;
                        this._currentLook = looks[j];
                    }
                    else {
                        this._currentLook = looks[0];
                    }
                    this._recalculateLookOffsets();
                    update = { look: this._currentLook.canvas };
                    update.x = this._positionX + this._lookOffsetX;
                    update.y = this._positionY + this._lookOffsetY;
                    this._triggerOnChange(update);
                    return true;
                }
            }
            //var look = this._gameEngine.getLookImage(this._currentLook.imageId),
            //    update = { look: look.canvas };
            //this._recalculateLookOffsets();
            ////center = look.center,
            ////angle = (this._rotationStyle === PocketCode.RotationStyle.ALL_AROUND) ? center.angle - (this._direction - 90.0) * Math.PI / 180.0 : center.angle;
            //update.x = this._positionX + this._lookOffsetX;
            //update.y = this._positionY + this._lookOffsetY;
            //this._triggerOnChange(update);
            //return true;
            return false;
        },
        /**
         * sets the size of the sprite with percentage "value"
         * @param {number} percentage
         * @returns {boolean}
         */
        setSize: function (percentage) {
            if (percentage === undefined || isNaN(percentage) || percentage == null)
                throw new Error('invalid percentage ');

            var value = percentage / 100.0;
            if (this._scaling === value || (this._scaling === 0 && value <= 0))
                return false;

            //var size = percentage;
            if (value < 0)
                value = 0;
            this._scaling = value;
            this._recalculateLookOffsets();
            //var scaling = this._currentLook ? this._gameEngine.getLookImage(this._currentLook.imageId).initialScaling : 1.0;   //TODO: delete initial scaling???
            this._triggerOnChange({ scaling: this._scaling });//{ size: this._size });
            return true;
        },
        /**
         * changes the current size by "value"
         * @param {number} value
         * @returns {boolean}
         */
        changeSize: function (value) {  //TODO: checkout default behaviour on <0
            if (value === undefined || isNaN(value) || value == null)
                throw new Error('invalid value');
            //if (!value)// || (this._size === 0 && (this._size + value) <= 0))
            //    return false;

            var size = this._scaling * 100.0 + value;
            if (size < 0)
                size = 0;

            var scaling = size / 100.0;
            if (this._scaling == scaling)
                return false;

            this._scaling = scaling;//size / 100.0;
            //var scaling = this._currentLook ? this._gameEngine.getLookImage(this._currentLook.imageId).initialScaling : 1.0;   //TODO: delete initial scaling???
            this._triggerOnChange({ scaling: scaling });
            return true;
        },
        /**
         * sets the sprite as not visible
         * @returns {boolean}
         */
        hide: function () {
            if (!this._visible)
                return false;

            this._visible = false;
            this._triggerOnChange({ visible: false });
            return true;
        },
        /**
         * sets the sprite as visible
         * @returns {boolean}
         */
        show: function () {
            if (this._visible)
                return false;

            this._visible = true;
            this._triggerOnChange({ visible: true });
            return true;
        },
        /**
         * sets the graphicEffect of the sprite with a given effect and value of the effect
         * @param {PocketCode.GraphicEffect} effect
         * @param {number} value
         * @returns {*}
         */
        setGraphicEffect: function (effect, value) {
            if (value === undefined || isNaN(value)) {
                throw new Error('invalid value ');
            }
            switch (effect) {
                case PocketCode.GraphicEffect.GHOST:    //=transparency
                    return this._setTransparency(value);
                case PocketCode.GraphicEffect.BRIGHTNESS:
                    return this._setBrightness(value);
                case PocketCode.GraphicEffect.COLOR:
                    return this._setColorEffect(value);
                case PocketCode.GraphicEffect.FISHEYE:
                case PocketCode.GraphicEffect.MOSAIC:
                case PocketCode.GraphicEffect.PIXELATE:
                case PocketCode.GraphicEffect.WHIRL:
                    return false;   //currently not supported

                default:
                    throw new Error('unknown graphic effect: ' + effect);
            }
        },
        /**
         * changes the graphicEffect with a given effect and value of the effect
         * @param {PocketCode.GraphicEffect} effect
         * @param {number} value
         * @returns {*}
         */
        changeGraphicEffect: function (effect, value) {
            if (value === undefined || isNaN(value)) {
                throw new Error('invalid value: ');
                //return false;
            }
            switch (effect) {
                case PocketCode.GraphicEffect.GHOST:    //=transparency
                    return this._changeTransparency(value);
                case PocketCode.GraphicEffect.BRIGHTNESS:
                    return this._changeBrightness(value);
                case PocketCode.GraphicEffect.COLOR:
                    return this._changeColorEffect(value);
                case PocketCode.GraphicEffect.FISHEYE:
                case PocketCode.GraphicEffect.MOSAIC:
                case PocketCode.GraphicEffect.PIXELATE:
                case PocketCode.GraphicEffect.WHIRL:
                    return false;   //currently not supported

                default:
                    throw new Error('unknown graphic effect: ' + effect);
            }
        },
        /* set to private and called from set/change graphic effect*/
        /**
         * sets the transparency of the sprite by the "value" percentage
         * @param {number} percentage
         * @returns {boolean}
         * @private
         */
        _setTransparency: function (percentage) {
            //if (percentage === undefined) //->error on set grafic effect
            //    return false;

            if (percentage < 0.0)
                percentage = 0.0;
            if (percentage > 100.0)
                percentage = 100.0;

            if (this._transparency === percentage)
                return false;

            this._transparency = percentage;
            this._triggerOnChange({ graphicEffects: [{ effect: PocketCode.GraphicEffect.GHOST, value: percentage }] });
            return true;
        },
        /* set to private and called from set/change graphic effect*/
        /**
         * changes the transparency of the sprite by the "value" percentage
         * @param {number} percentage
         * @returns {boolean}
         * @private
         */
        _changeTransparency: function (value) {
            //if (value === undefined)  //->error on set grafic effect
            //    return false;

            value = this._transparency + value;
            if (value < 0.0)
                value = 0.0;
            if (value > 100.0)
                value = 100.0;

            if (this._transparency === value)
                return false;

            this._transparency = value;
            this._triggerOnChange({ graphicEffects: [{ effect: PocketCode.GraphicEffect.GHOST, value: value }] });
            return true;
        },
        /* set to private and called from set/change graphic effect*/
        /**
         * sets the brightness of the sprite by the "value" percentage
         * @param {number} percentage
         * @returns {boolean}
         * @private
         */
        _setBrightness: function (percentage) {
            //if (percentage === undefined) //->error on set grafic effect
            //    return false;

            if (percentage < 0.0)
                percentage = 0.0;
            if (percentage > 200.0)
                percentage = 200.0;

            if (this._brightness === percentage)
                return false;

            this._brightness = percentage;
            this._triggerOnChange({ graphicEffects: [{ effect: PocketCode.GraphicEffect.BRIGHTNESS, value: percentage - 100.0 }] });  //send +-100 instead of 0..200
            return true;
        },
        /* set to private and called from set/change graphic effect*/
        /**
         * changes the brightness of the sprite by the "value" percentage
         * @param {number} percentage
         * @returns {boolean}
         * @private
         */
        _changeBrightness: function (value) {
            //if (value === undefined)  //->error on set grafic effect
            //    return false;

            value = this._brightness + value;
            if (value < 0.0)
                value = 0.0;
            if (value > 200.0)
                value = 200.0;

            if (this._brightness === value)
                return false;

            this._brightness = value;
            this._triggerOnChange({ graphicEffects: [{ effect: PocketCode.GraphicEffect.BRIGHTNESS, value: value - 100.0 }] }); //send +-100 instead of 0..200
            return true;
        },
        /* set to private and called from set/change graphic effect*/
        /**
         * sets the color effect of the sprite by the "value" percentage
         * @param {number} percentage
         * @returns {boolean}
         * @private
         */
        _setColorEffect: function (percentage) {
            //if (percentage === undefined) //->error on set grafic effect
            //    return false;

            if (percentage < 0.0)
                percentage = 0.0;
            if (percentage > 100.0)
                percentage = 100.0;

            if (this._colorEffect === percentage)
                return false;

            this._colorEffect = percentage;
            this._triggerOnChange({ graphicEffects: [{ effect: PocketCode.GraphicEffect.COLOR, value: percentage }] });
            return true;
        },
        /* set to private and called from set/change graphic effect*/
        /**
         * changes the color effect of the sprite by the "value" percentage
         * @param {number} percentage
         * @returns {boolean}
         * @private
         */
        _changeColorEffect: function (value) {
            //if (value === undefined)  //->error on set grafic effect
            //    return false;

            value = this._colorEffect + value;
            if (value < 0.0)
                value = 0.0;
            if (value > 100.0)
                value = 100.0;

            if (this._colorEffect === value)
                return false;

            this._colorEffect = value;
            this._triggerOnChange({ graphicEffects: [{ effect: PocketCode.GraphicEffect.COLOR, value: value }] });
            return true;
        },
        /**
         * clears all graphicEffects of the sprite
         * @returns {boolean}
         */
        clearGraphicEffects: function () {
            var graphicEffects = [];
            if (this._transparency === 0.0 && this._brightness === 100.0 && this._colorEffect === 0.0)   //TODO: extend this when adding effects
                return false;

            if (this._transparency != 0.0) {
                this._transparency = 0.0;
                graphicEffects.push({ effect: PocketCode.GraphicEffect.GHOST, value: 0.0 });
            }
            if (this._brightness != 100.0) {
                this._brightness = 100.0;
                graphicEffects.push({ effect: PocketCode.GraphicEffect.BRIGHTNESS, value: 100.0 });
            }
            if (this._colorEffect != 0.0) {
                this._colorEffect = 0.0;
                graphicEffects.push({ effect: PocketCode.GraphicEffect.COLOR, value: 0.0 });
            }

            if (graphicEffects.length > 0) {
                this._triggerOnChange({ graphicEffects: graphicEffects });
                return true;
            }
            return false;
        },
        ///**
        // * checks if sprite flips at the edge
        // * @returns {*}
        // */
        //ifOnEdgeBounce: function () {
        //    return this._gameEngine.ifSpriteOnEdgeBounce(this);//.id, this);    //TODO: check parameters: this, 
        //    //onChange event is triggered by program in this case
        //},
        ifOnEdgeBounce: function () {

            if (!this.currentLook)   //no look defined (cannot be changed either): no need to handle this
                return false;

            var size = this._gameEngine.projectScreenSize;
            var sh2 = size.height / 2.0,
                sw2 = size.width / 2.0,
                dir = this.direction,
                x = this.positionX,
                y = this.positionY;

            var look = this.currentLook,
                //lookId = this.currentLook.imageId,    //TODO: this may change to lookId (next version)
                scaling = this.size / 100.0,
                rotation = this.rotationStyle === PocketCode.RotationStyle.ALL_AROUND ? dir - 90.0 : 0.0,
                //^^ sprite has a direction but is not rotated
                flipX = this.rotationStyle === PocketCode.RotationStyle.LEFT_TO_RIGHT && dir < 0.0 ? true : false;


            //var imgStore = this._imageStore;
            /* interface to use: imgStore.getLookBoundary(spriteId, lookId, scalingFactor, rotationAngle, flipX, pixelAccuracy)
            *  sprite is needed for caching index, accuracy (boolean) indicates, if you need pixel-exact proportions (which should not be used for the first check)
            *  the return value looks like: { top: , right: , bottom: , left: , pixelAccuracy: }
            *  offsets: these properties include the distances between the sprite center and the bounding box edges (from center x/y).. these can be negative as well
            *  pixelAccuracy: might be true even if not requested -> if we already have exact values stored in the cache (to increase performance)
            */

            var boundary = look.getBoundary(scaling, rotation, flipX, false);//imgStore.getLookBoundary(sprite.id, lookId, scaling, rotation, flipX, false);
            //{top, right, bottom, left, pixelAccuracy} from look center to bounding area borders (may be negative as well, e.g. if the center is outside of visisble pixels)

            //quick check
            if (!boundary.pixelAccuracy &&
                y + boundary.top < sh2 &&
                x + boundary.right < sw2 &&
                y + boundary.bottom > -sh2 &&
                x + boundary.left > -sw2)
                return false;

            boundary = look.getBoundary(scaling, rotation, flipX, true);//imgStore.getLookBoundary(this.id, lookId, scaling, rotation, flipX, true);    //update to exact values at collision
            if (y + boundary.top < sh2 &&
                x + boundary.right < sw2 &&
                y + boundary.bottom > -sh2 &&
                x + boundary.left > -sw2)
                return false;

            //handle bounce
            var centerOffset = {  //store the center position of the current area
                x: (boundary.right + boundary.left) / 2.0,
                y: (boundary.top + boundary.bottom) / 2.0,
            };

            var vpEdges = { //viewport edges
                top: {
                    overflow: y + boundary.top - sh2,
                    ignore: false,
                    inDirection: Math.abs(dir) <= 90.0,
                    calcDirection: function (dir) { return dir >= 0.0 ? 180.0 - dir : -180.0 - dir; },    // //make sure we do not get an angle within +-180
                },
                right: {
                    overflow: x + boundary.right - sw2,
                    ignore: false,
                    inDirection: dir >= 0.0,
                    calcDirection: function (dir) { return dir == 180.0 ? dir : -dir; },
                },
                bottom: {
                    overflow: -y - boundary.bottom - sh2,
                    ignore: false,
                    inDirection: Math.abs(dir) > 90.0,
                    calcDirection: function (dir) { return dir > 0.0 ? 180.0 - dir : -180.0 - dir; },
                },
                left: {
                    overflow: -x - boundary.left - sw2,
                    ignore: false,
                    inDirection: dir < 0.0,
                    calcDirection: function (dir) { return -dir; },
                },
                getXCorrection: function () {   //TODO: !!!!!!!!!!!!!!!   move in direction!!!!!!!!!!!!
                    var c,
                        l = vpEdges.left,
                        r = vpEdges.right;

                    if (l.ignore || r.ignore) {
                        return l.ignore ? -r.overflow : l.overflow; //overflows can be negativ as well (after rotation)- we also have to take care of this 
                    }
                    //after rotation there can be a an overflow that didn't exist before
                    if (l.overflow > 0.0 && r.overflow > 0.0 || l.overflow + r.overflow > 0.0) {  //check as well, if the rotated area still fits in the viewport
                        //move from original direction
                        if (dir >= 0.0)
                            return -r.overflow;
                        else
                            return l.overflow;
                    }
                    else if (l.overflow > 0.0)
                        return l.overflow;  //check if lo+ro < 0 -> else: include direction
                    else if (r.overflow > 0.0)
                        return -r.overflow;
                    return 0.0;   //move to center already applied
                },
                getYCorrection: function () {       //TODO: abh�ngig von dir  (nicht newDir)- falls beide nicht ignored !!!!!!!!!!!!!!!   move in direction!!!!!!!!!!!!
                    var c,
                        t = vpEdges.top,
                        b = vpEdges.bottom;
                    if (t.ignore || b.ignore) {
                        return t.ignore ? b.overflow : -t.overflow;
                    }
                    //after rotation
                    if (t.overflow > 0.0 && b.overflow > 0.0) {
                        //move from original direction
                        if (Math.abs(dir) <= 90.0)
                            return -t.overflow;
                        else
                            return b.overflow;
                    }
                    else if (t.overflow > 0.0)
                        return -t.overflow;
                    else if (b.overflow > 0.0)
                        return b.overflow;
                    return 0.0;   //move to center already applied
                },
            };

            //check if overflow
            //if (vpEdges.top.overflow <= 0.0 &&
            //    vpEdges.right.overflow <= 0.0 &&
            //    vpEdges.bottom.overflow <= 0.0 &&
            //    vpEdges.left.overflow <= 0.0)
            //    return false;   //no collision: pixel exact calculation

            //handle conflics: if there is an overflow on both sides we always bounce from the side the sprites points to
            if (vpEdges.top.overflow > 0.0 && vpEdges.bottom.overflow > 0.0) {
                if (Math.abs(dir) <= 90.0)
                    vpEdges.bottom.ignore = true;
                else
                    vpEdges.top.ignore = true;
            }
            if (vpEdges.left.overflow > 0.0 && vpEdges.right.overflow > 0.0) {
                if (dir < 0.0)
                    vpEdges.right.ignore = true;
                else
                    vpEdges.left.ignore = true;
            }

            //calc new positions and direction: we need this to compare new with existing properties to trigger the update event correctly
            var newDir = dir,
                newX = x,
                newY = y;//,
            //bounce = { top: undefined, right: undefined, bottom: undefined, left: undefined };    //to store the current operation: we only bounce once at a time and recall this method
            //var edgesToHandle;

            //up to now, there are only 2 neigboured edges left at max (not ignored): let's call them p(rimus) and s(ecundus), where p (at least) is always inDirection (if one of them is)
            var p, s;
            if (vpEdges.top.overflow > 0.0 && !vpEdges.top.ignore) {
                p = vpEdges.top;
            }
            if (vpEdges.right.overflow > 0.0 && !vpEdges.right.ignore) {
                if (!p)
                    p = vpEdges.right;
                else if (p && vpEdges.right.inDirection) {
                    s = p;
                    p = vpEdges.right;
                }
                else
                    s = vpEdges.right;
            }
            if (vpEdges.bottom.overflow > 0.0 && !vpEdges.bottom.ignore) {
                if (!p)
                    p = vpEdges.bottom;
                else if (p && vpEdges.bottom.inDirection) {
                    s = p;
                    p = vpEdges.bottom;
                }
                else
                    s = vpEdges.bottom;
            }
            if (vpEdges.left.overflow > 0.0 && !vpEdges.left.ignore) {
                if (!p)
                    p = vpEdges.left;
                else if (p && vpEdges.left.inDirection) {
                    s = p;
                    p = vpEdges.left;
                }
                else
                    s = vpEdges.left;
            }

            //calc positions and rotations
            if (p && p.inDirection)
                newDir = p.calcDirection(newDir);
            if (s && s.inDirection)
                newDir = s.calcDirection(newDir);

            var updateBoundary = false;
            if (newDir != dir && this.rotationStyle == PocketCode.RotationStyle.ALL_AROUND) {
                rotation = newDir - 90.0;
                updateBoundary = true;
            }
            else if (newDir != dir && this.rotationStyle == PocketCode.RotationStyle.LEFT_TO_RIGHT) {
                rotation = 0.0;
                if ((newDir >= 0.0 && dir < 0.0) || (newDir < 0.0 && dir >= 0.0)) { //flipX changed
                    flipX = !flipX;
                    updateBoundary = true;
                }
            }

            if (updateBoundary) {
                boundary = look.getBoundary(scaling, rotation, flipX, true);//imgStore.getLookBoundary(this.id, lookId, scaling, rotation, flipX, true);    //recalculate
                //center = {  //update center position of the current area
                //    x: x + (boundary.right + boundary.left) / 2.0,
                //    y: y + (boundary.top + boundary.bottom) / 2.0,
                //};
                //adjust: keep the area center during rotate
                newX += centerOffset.x - (boundary.right + boundary.left) / 2.0;
                newY += centerOffset.y - (boundary.top + boundary.bottom) / 2.0;
                //update overflows
                vpEdges.top.overflow = newY + boundary.top - sh2;
                vpEdges.right.overflow = newX + boundary.right - sw2;
                vpEdges.bottom.overflow = -newY - boundary.bottom - sh2;
                vpEdges.left.overflow = -newX - boundary.left - sw2;
            }
            //set position
            newX += vpEdges.getXCorrection();
            newY += vpEdges.getYCorrection();

            //set sprite values: avoid triggering multiple onChange events
            var props = {};
            if (this.direction !== newDir) {
                this.setDirection(newDir, false);
                props.rotation = newDir - 90.0;
            }
            if (this.positionX !== newX) {
                props.x = newX;
            }
            if (this.positionY !== newY) {
                props.y = newY;
            }
            this.setPosition(newX, newY, false);

            //this._onSpriteUiChange.dispatchEvent({ id: this.id, properties: props }, this); //TODO
            if (!props.rotation && !props.x && !props.y)
                return false;
            this._triggerOnChange(props);
            return true;
        },

        /* override */
        dispose: function () {
            this.stopScripts();

            this._gameEngine = undefined;   //make sure the game engine is not disposed
            var script,
                scripts = this._scripts;
            for (var i = 0, l = scripts.length; i < l; i++) {  //remove handlers
                script = scripts[i];
                if (script.onExecuted)  //supported by all (root container) scripts
                    script.onExecuted.removeEventListener(new SmartJs.Event.EventListener(this._scriptOnExecuted, this));
            }

            //call super
            PocketCode.UserVariableHost.prototype.dispose.call(this);
        },
    });

    return Sprite;
})();