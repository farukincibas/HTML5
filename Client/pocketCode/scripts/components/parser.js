﻿/// <reference path="../../../smartJs/sj.js" />
/// <reference path="../core.js" />
/// <reference path="../model/bricksCore.js" />
/// <reference path="../model/bricksControl.js" />
/// <reference path="../model/bricksSound.js" />
/// <reference path="../model/bricksMotion.js" />
/// <reference path="../model/bricksSound.js" />
/// <reference path="../model/bricksVariables.js" />
/// <reference path="../component/sprite.js" />
'use strict';

PocketCode.merge({

    SpriteFactory: (function () {
        function SpriteFactory(device, program, broadcastMgr, soundMgr, totalCount) {
            //this._bricksCount = bricksCount || 0;
            this._program = program;
            this._brickFactory = new PocketCode.BrickFactory(device, program, broadcastMgr, soundMgr, totalCount);

            //we use the brickFactory events here
            this._onProgressChange = this._brickFactory.onProgressChange;
            this._onUnsupportedBricksFound = this._brickFactory.onUnsupportedBricksFound;
        }

        //events
        Object.defineProperties(SpriteFactory.prototype, {
            onProgressChange: {
                get: function () { return this._onProgressChange; },
                //enumerable: false,
                //configurable: true,
            },
            onUnsupportedBricksFound: {
                get: function () { return this._onUnsupportedBricksFound; },
                //enumerable: false,
                //configurable: true,
            },
        });

        SpriteFactory.prototype.create = function (jsonSprite) {
            if(typeof jsonSprite == 'object' && jsonSprite instanceof Array)
                throw new Error('invalid argument: expected type: object')
            
            var sprite = new PocketCode.Sprite(this._program, jsonSprite);
            var bricks = [];
            for (var i = 0, l = jsonSprite.bricks.length; i < l; i++) {
                bricks.push(this._brickFactory.create(sprite, jsonSprite.bricks[i]));
            }
            sprite.bricks = bricks;
            return sprite;
        };

        return SpriteFactory;
    })(),


    BrickFactory: (function () {
        function BrickFactory(device, program, broadcastMgr, soundMgr, totalCount) {
            this._device = device;
            this._gameEngine = program;
            this._broadcastMgr = broadcastMgr;
            this._soundMgr = soundMgr;

            this._total = totalCount;
            this._parsed = 0;
            this._updatePercentage = 0.0;
            this._unsupportedBricks = [];

            this._onProgressChange = new SmartJs.Event.Event(this);
            this._onUnsupportedBricksFound = new SmartJs.Event.Event(this);
        }

        //events
        Object.defineProperties(BrickFactory.prototype, {
            onProgressChange: {
                get: function () { return this._onProgressChange; },
                //enumerable: false,
                //configurable: true,
            },
            onUnsupportedBricksFound: {
                get: function () { return this._onUnsupportedBricksFound; },
                //enumerable: false,
                //configurable: true,
            },
        });

        //methods
        BrickFactory.prototype.merge({
            create: function (currentSprite, jsonBrick) {
                var type = jsonBrick.type + 'Brick';
                var brick = undefined;

                switch (type) {
                    case 'ProgramStartBrick':
                    case 'WhenActionBrick':
                        brick = new PocketCode.Bricks[type](this._device, this._gameEngine, currentSprite, jsonBrick);
                        break;

                    case 'BroadcastReceiveBrick':
                    case 'BroadcastBrick':
                    case 'BroadcastAndWaitBrick':
                        brick = new PocketCode.Bricks[type](this._device, currentSprite, this._broadcastMgr, jsonBrick);
                        break;

                    case 'PlaySoundBrick':
                    case 'StopAllSoundsBrick':
                    case 'SetVolumeBrick':
                    case 'ChangeVolumeBrick':
                    case 'SpeakBrick':
                        brick = new PocketCode.Bricks[type](this._device, currentSprite, this._soundMgr, jsonBrick);
                        break;

                    default:
                        if (PocketCode.Bricks[type])
                            brick = new PocketCode.Bricks[type](this._device, currentSprite, jsonBrick);
                        else {
                            brick = new PocketCode.Bricks.UnsupportedBrick(this._device, currentSprite, jsonBrick);
                        }
                }

                if (brick instanceof PocketCode.Bricks.UnsupportedBrick)
                    this._unsupportedBricks.push(brick);


                //load sub bricks
                if (!(brick instanceof PocketCode.Bricks.UnsupportedBrick)) {
                    if (jsonBrick.bricks)   //all loops
                        brick._bricks = this._createList(currentSprite, jsonBrick.bricks);
                    else if (jsonBrick.ifBricks) {  // && jsonBrick.elseBricks) {  //if then else
                        brick._ifBricks = this._createList(currentSprite, jsonBrick.ifBricks);
                        brick._elseBricks = this._createList(currentSprite, jsonBrick.elseBricks);
                    }
                }

                this._parsed++; //this has to be incremented after creating the sub items to avoid the unsupported brick event trigger more than once
                this._updateProgress();

                //add event listener
                //if (brick instanceof PocketCode.Bricks.RootContainerBrick) {
                //	//TODO: this has to be handled by the brick itself: check if there is a testcast for adding an event handler
                //}

                if (this._total === this._parsed && this._unsupportedBricks.length > 0)
                    this._onUnsupportedBricksFound.dispatchEvent({ unsupportedBricks: this._unsupportedBricks });

                return brick;
            },
            _createList: function (currentSprite, jsonBricks) {    //returns bricks as a BrickContainer
                var bricks = [];
                for (var i = 0, l = jsonBricks.length; i < l; i++)
                    bricks.push(this.create(currentSprite, jsonBricks[i]));
                return new PocketCode.Bricks.BrickContainer(bricks);
            },
            _updateProgress: function () {
                var progress = 100.0 / this._total * this._parsed;
                //we do not want to trigger several hundred progress updates.. every 5% should be enough
                if (progress === 100.0 || (progress - this._updatePercentage) >= 5.0) {
                    this._updatePercentage = progress;
                    progress = Math.round(progress * 10) / 10;  //show only one decimal place
                    this._onProgressChange.dispatchEvent({ progress: progress });
                }

            },
        });

        return BrickFactory;
    })(),


    FormulaParser: (function () {
        function FormulaParser() {
            this._isStatic = false;
        }

        FormulaParser.prototype.merge({
            getUiString: function (jsonFormula, variableNames) {
                if (!variableNames)
                    throw new Error('invalid argument: variableNames (lookup dictionary required)');
                this._variableNames = variableNames;

                return this._parseJsonType(jsonFormula, true);
            },
            parseJson: function (jsonFormula) {
                this._isStatic = true;
                var formulaString = this._parseJsonType(jsonFormula);

                //formulaString = (typeof formulaString === 'string') ? '"' + formulaString + '"' : formulaString;
                return { calculate: new Function('return ' + formulaString + ';'), isStatic: this._isStatic };

                //return new Function('return ' + formulaString + ';');
            },

            _parseJsonType: function (jsonFormula, uiString) {
                if (jsonFormula === null)
                    return '';

                /* package org.catrobat.catroid.formulaeditor: class FormulaElement: enum ElementType
                *  OPERATOR, FUNCTION, NUMBER, SENSOR, USER_VARIABLE, BRACKET, STRING
                */
                switch (jsonFormula.type) {
                    case 'OPERATOR':
                        return this._parseJsonOperator(jsonFormula, uiString);

                    case 'FUNCTION':
                        return this._parseJsonFunction(jsonFormula, uiString);

                    case 'NUMBER':
                        //if (uiString)
                        return jsonFormula.value;
                        //var num = Number(jsonFormula.value);
                        //if (isNaN(num))
                        //    throw new Error('invalid operator/type \'number\': string to number conversion failed');
                        //return Number(jsonFormula.value);// + '';  //as string?

                    case 'SENSOR':
                        this._isStatic = false;
                        return this._parseJsonSensor(jsonFormula, uiString);

                    case 'USER_VARIABLE':
                        if (uiString) {
                            var variable = this._variableNames.local[jsonFormula.value] || this._variableNames.gloabl[jsonFormula.value];
                            return '"' + variable.name + '"';
                        }

                        this._isStatic = false;
                        return 'this._sprite.getVariable(\'' + jsonFormula.value + '\').value';

                    case 'USER_LIST':
                        return '';  //TODO:

                    case 'BRACKET':
                        //if (!jsonFormula.right)
                        //    return '()';

                        return '(' + this._parseJsonType(jsonFormula.right, uiString) + ')';

                    case 'STRING':
                        return '\'' + jsonFormula.value + '\'';

                    default:
                        throw new Error('formula parser: unknown type: ' + jsonFormula.type);
                }
            },

            _concatOperatorFormula: function (jsonFormula, operator, uiString) {
                return this._parseJsonType(jsonFormula.left, uiString) + operator + this._parseJsonType(jsonFormula.right, uiString);
            },
            _parseJsonOperator: function (jsonFormula, uiString) {
                /* package org.catrobat.catroid.formulaeditor: enum Operators */
                switch (jsonFormula.value) {
                    case 'LOGICAL_AND':
                        if (uiString)
                            return this._concatOperatorFormula(jsonFormula, ' AND ', uiString);
                        return this._concatOperatorFormula(jsonFormula, ' && ');

                    case 'LOGICAL_OR':
                        if (uiString)
                            return this._concatOperatorFormula(jsonFormula, ' OR ', uiString);
                        return this._concatOperatorFormula(jsonFormula, ' || ');

                    case 'EQUAL':
                        if (uiString)
                            return this._concatOperatorFormula(jsonFormula, ' = ', uiString);
                        return this._concatOperatorFormula(jsonFormula, ' === ');

                    case 'NOT_EQUAL':
                        if (uiString)
                            return this._concatOperatorFormula(jsonFormula, ' ≠ ', uiString);
                        return this._concatOperatorFormula(jsonFormula, ' !== ');

                    case 'SMALLER_OR_EQUAL':
                        if (uiString)
                            return this._concatOperatorFormula(jsonFormula, ' ≤ ', uiString);
                        return this._concatOperatorFormula(jsonFormula, ' <= ');

                    case 'GREATER_OR_EQUAL':
                        if (uiString)
                            return this._concatOperatorFormula(jsonFormula, ' ≥ ', uiString);
                        return this._concatOperatorFormula(jsonFormula, ' >= ');

                    case 'SMALLER_THAN':
                        return this._concatOperatorFormula(jsonFormula, ' < ', uiString);

                    case 'GREATER_THAN':
                        return this._concatOperatorFormula(jsonFormula, ' > ', uiString);

                    case 'PLUS':
                        return this._concatOperatorFormula(jsonFormula, ' + ', uiString);

                    case 'MINUS':
                        if (uiString && jsonFormula.left === null)    //singed number
                            return this._concatOperatorFormula(jsonFormula, '-', uiString);
                        return this._concatOperatorFormula(jsonFormula, ' - ', uiString);

                    case 'MULT':
                        if (uiString)
                            return this._concatOperatorFormula(jsonFormula, ' x ', uiString);
                        return this._concatOperatorFormula(jsonFormula, ' * ');

                    case 'DIVIDE':
                        if (uiString)
                            return this._concatOperatorFormula(jsonFormula, ' ÷ ', uiString);
                        return this._concatOperatorFormula(jsonFormula, ' / ');

                        //case 'MOD':
                        //    return this._concatOperatorFormula(jsonFormula, ' % ');

                        //case 'POW':
                        //    return 'Math.pow(' + this._concatOperatorFormula(jsonFormula, ', ') + ')';

                    case 'LOGICAL_NOT':
                        if (uiString)
                            return ' NOT ' + this._parseJsonType(jsonFormula.right, uiString);
                        return '!' + this._parseJsonType(jsonFormula.right);

                    default:
                        throw new Error('formula parser: unknown operator: ' + jsonFormula.value);
                }
            },

            _parseJsonFunction: function (jsonFormula, uiString) {
                /* package org.catrobat.catroid.formulaeditor: enum Functions
                *  SIN, COS, TAN, LN, LOG, SQRT, RAND, ROUND, ABS, PI, MOD, ARCSIN, ARCCOS, ARCTAN, EXP, MAX, MIN, TRUE, FALSE, LENGTH, LETTER, JOIN;
                */
                switch (jsonFormula.value) {
                    case 'SIN':
                        if (uiString)
                            return 'sin(' + this._parseJsonType(jsonFormula.left, uiString) + ')';
                        return 'Math.sin(this._degree2radian(' + this._parseJsonType(jsonFormula.left) + '))';

                    case 'COS':
                        if (uiString)
                            return 'cos(' + this._parseJsonType(jsonFormula.left, uiString) + ')';
                        return 'Math.cos(this._degree2radian(' + this._parseJsonType(jsonFormula.left) + '))';

                    case 'TAN':
                        if (uiString)
                            return 'tan(' + this._parseJsonType(jsonFormula.left, uiString) + ')';
                        return 'Math.tan(this._degree2radian(' + this._parseJsonType(jsonFormula.left) + '))';

                    case 'LN':
                        if (uiString)
                            return 'ln(' + this._parseJsonType(jsonFormula.left, uiString) + ')';
                        return 'Math.log(' + this._parseJsonType(jsonFormula.left) + ')';

                    case 'LOG':
                        if (uiString)
                            return 'log(' + this._parseJsonType(jsonFormula.left, uiString) + ')';
                        return 'this._log10(' + this._parseJsonType(jsonFormula.left) + ')';

                    case 'SQRT':
                        if (uiString)
                            return 'sqrt(' + this._parseJsonType(jsonFormula.left, uiString) + ')';
                        return 'Math.sqrt(' + this._parseJsonType(jsonFormula.left) + ')';

                    case 'RAND':
                        if (uiString)
                            return 'random(' + this._parseJsonType(jsonFormula.left, uiString) + ', ' + this._parseJsonType(jsonFormula.right, uiString) + ')';

                        this._isStatic = false;
                        //please notice: this function is quite tricky, as the 2 parametes can be switched (min, max) and we need to calculate this two values
                        //at runtime to determine which one to use
                        //if both partial results are integers, the random number will be a number without decimal places
                        //for calculation we need the scope of the formula itself! To solve this, the whole logic is included in our dynamic function
                        var lString = '(' + this._parseJsonType(jsonFormula.left) + ')';
                        var rString = '(' + this._parseJsonType(jsonFormula.right) + ')';

                        var stmt = '(' + lString + ' <= ' + rString + ') ? ';
                        stmt += '((' + lString + ' % 1 === 0 && ' + rString + ' % 1 === 0) ? (Math.floor(Math.random() * (' + rString + '+ 1 -' + lString + ') + ' + lString + ')) : (Math.random() * (' + rString + '-' + lString + ') + ' + lString + ')) : ';
                        stmt += '((' + lString + ' % 1 === 0 && ' + rString + ' % 1 === 0) ? (Math.floor(Math.random() * (' + lString + '+ 1 -' + rString + ') + ' + rString + ')) : (Math.random() * (' + lString + '-' + rString + ') + ' + rString + '))';
                        //var test = ((1.0) <= (1.01)) ? (((1.0) % 1 === 0 && (1.01) % 1 === 0) ? (Math.floor(Math.random() * ((1.01) - (1.0)) + (1.0))) : (Math.random() * ((1.01) - (1.0)) + (1.0))) : (((1.0) % 1 === 0 && (1.01) % 1 === 0) ? (Math.floor(Math.random() * ((1.0) - (1.01)) + (1.01))) : (Math.random() * ((1.0) - (1.01)) + (1.01)));

                        return stmt;
                        //var functionBody = 'var left = (' + this.parseJson(this._parseJsonType(jsonFormula.left)) + ').calculate(); ';
                        //functionBody += 'var right = (' + this.parseJson(this._parseJsonType(jsonFormula.right)) + ').calculate(); ';
                        ////functionBody += 'var returnInt = (left % 1 === 1 && right % 1 === 0); ';
                        //functionBody += 'if (left < right) { ';
                        //functionBody += 'var factor = (right - left); var offset = left; } else { ';
                        //functionBody += 'var factor = (left - right); var offset = right; } ';
                        //functionBody += 'if (left % 1 === 0 && right % 1 === 0) ';  //retrun value as integer 
                        //functionBody += '';
                        //functionBody += '';

                        //var left = (this.parseJson(this._parseJsonType(jsonFormula.left))).calculate();
                        //var right = (this.parseJson(this._parseJsonType(jsonFormula.right))).calculate();
                        //if (left < right) //min = left
                        //    return 'Math.random() * ' + (right - left) + ' + ' + left;// + this._parseJsonType(jsonFormula.right) + ') + ' + this._parseJsonType(jsonFormula.left) + ')';
                        //else
                        //    return 'Math.random() * ' + (left - right) + ' + ' + right;// + this._parseJsonType(jsonFormula.right) + ') + ' + this._parseJsonType(jsonFormula.left) + ')';
                        ////return 'Math.floor((Math.random() * ' + this._parseJsonType(jsonFormula.right) + ') + ' + this._parseJsonType(jsonFormula.left) + ')';  //TODO:
                        ////return 'Math.random() * ' + this._parseJsonType(jsonFormula.right) + ') + ' + this._parseJsonType(jsonFormula.left) + ')';  //TODO:

                    case 'ROUND':
                        if (uiString)
                            return 'round(' + this._parseJsonType(jsonFormula.left, uiString) + ')';
                        return 'Math.round(' + this._parseJsonType(jsonFormula.left) + ')';

                    case 'ABS':
                        if (uiString)
                            return 'abs(' + this._parseJsonType(jsonFormula.left, uiString) + ')';
                        return 'Math.abs(' + this._parseJsonType(jsonFormula.left) + ')';

                    case 'PI':
                        if (uiString)
                            return 'pi';
                        return 'Math.PI';

                    case 'MOD':
                        if (uiString)
                            return 'mod(' + this._parseJsonType(jsonFormula.left, uiString) + ', ' + this._parseJsonType(jsonFormula.right, uiString) + ')';
                        return this._concatOperatorFormula(jsonFormula, ' % ');

                    case 'ARCSIN':
                        if (uiString)
                            return 'arcsin(' + this._parseJsonType(jsonFormula.left, uiString) + ')';
                        return 'this._radian2degree(Math.asin(' + this._parseJsonType(jsonFormula.left) + '))';

                    case 'ARCCOS':
                        if (uiString)
                            return 'arccos(' + this._parseJsonType(jsonFormula.left, uiString) + ')';
                        return 'this._radian2degree(Math.acos(' + this._parseJsonType(jsonFormula.left) + '))';

                    case 'ARCTAN':
                        if (uiString)
                            return 'arctan(' + this._parseJsonType(jsonFormula.left, uiString) + ')';
                        return 'this._radian2degree(Math.atan(' + this._parseJsonType(jsonFormula.left) + '))';

                    case 'EXP':
                        if (uiString)
                            return 'exp(' + this._parseJsonType(jsonFormula.left, uiString) + ')';
                        return 'Math.exp(' + this._parseJsonType(jsonFormula.left) + ')';

                    case 'MAX':
                        if (uiString)
                            return 'max(' + this._concatOperatorFormula(jsonFormula, ', ', uiString) + ')';
                        return 'Math.max(' + this._concatOperatorFormula(jsonFormula, ', ') + ')';

                    case 'MIN':
                        if (uiString)
                            return 'min(' + this._concatOperatorFormula(jsonFormula, ', ', uiString) + ')';
                        return 'Math.min(' + this._concatOperatorFormula(jsonFormula, ', ') + ')';

                    case 'TRUE':
                        if (uiString)
                            return 'TRUE';
                        return 'true';

                    case 'FALSE':
                        if (uiString)
                            return 'FALSE';
                        return 'false';

                    case 'LENGTH':  //string
                        if (uiString)
                            return 'length(' + this._parseJsonType(jsonFormula.left, uiString) + ')';

                        if (jsonFormula.left)
                            return (jsonFormula.left.type === 'STRING') ? (this._parseJsonType(jsonFormula.left)).length - 2 : '((' + this._parseJsonType(jsonFormula.left) + ') + \'\').length';
                        return 0;

                    case 'LETTER':  //string
                        if (uiString)
                            return 'letter(' + this._parseJsonType(jsonFormula.left, uiString) + ', ' + this._parseJsonType(jsonFormula.right, uiString) + ')';

                        var idx = Number(this._parseJsonType(jsonFormula.left)) - 1; //given index (1..n)
                        //if (idx < 0 || idx >= jsonFormula.left.length)
                        //    return '';
                        //return jsonFormula.right.substr(idx, 1);
                        //break;
                        return '((' + this._parseJsonType(jsonFormula.right) + ') + \'\').charAt(' + idx + ')';

                    case 'JOIN':    //string
                        if (uiString)
                            return 'join(' + this._parseJsonType(jsonFormula.left, uiString) + ', ' + this._parseJsonType(jsonFormula.right, uiString) + ')';

                        return '((' + this._parseJsonType(jsonFormula.left) + ') + \'\').concat((' + this._parseJsonType(jsonFormula.right) + ') + \'\')';
                        //break;

                        //list functions
                    case 'NUMBER_OF_ITEMS':
                        //TODO: 

                    case 'LIST_ITEM':
                        //TODO: 

                    case 'CONTAINS':
                        //TODO:

                    default:
                        throw new Error('formula parser: unknown function: ' + jsonFormula.value);

                }
            },

            _parseJsonSensor: function (jsonFormula, uiString) {
                /* package org.catrobat.catroid.formulaeditor: enum Sensors
                *  X_ACCELERATION, Y_ACCELERATION, Z_ACCELERATION, COMPASS_DIRECTION, X_INCLINATION, Y_INCLINATION, LOUDNESS, FACE_DETECTED, FACE_SIZE, FACE_X_POSITION, FACE_Y_POSITION, OBJECT_X(true), OBJECT_Y(true), OBJECT_GHOSTEFFECT(true), OBJECT_BRIGHTNESS(true), OBJECT_SIZE(true), OBJECT_ROTATION(true), OBJECT_LAYER(true)
                */
                switch (jsonFormula.value) {
                    //sensors
                    case 'X_ACCELERATION':
                        if (uiString)
                            return 'acceleration_x';

                        //this._isStatic = false;
                        return 'this._device.accelerationX';

                    case 'Y_ACCELERATION':
                        if (uiString)
                            return 'acceleration_y';

                        //this._isStatic = false;
                        return 'this._device.accelerationY';

                    case 'Z_ACCELERATION':
                        if (uiString)
                            return 'acceleration_z';

                        //this._isStatic = false;
                        return 'this._device.accelerationZ';

                    case 'COMPASS_DIRECTION':
                        if (uiString)
                            return 'compass_direction';

                        //this._isStatic = false;
                        return 'this._device.compassDirection';

                    case 'X_INCLINATION':
                        if (uiString)
                            return 'inclination_x';

                        //this._isStatic = false;
                        return 'this._device.inclinationX';

                    case 'Y_INCLINATION':
                        if (uiString)
                            return 'inclination_y';

                        //this._isStatic = false;
                        return 'this._device.inclinationY';

                    case 'LOUDNESS':
                        if (uiString)
                            return 'loudness';

                        //this._isStatic = false;
                        return 'this._device.loudness';

                    case 'FACE_DETECTED':
                        if (uiString)
                            return 'is_face_detected';

                        //this._isStatic = false;
                        return 'this._device.faceDetected';

                    case 'FACE_SIZE':
                        if (uiString)
                            return 'face_size';

                        //this._isStatic = false;
                        return 'this._device.faceSize';

                    case 'FACE_X_POSITION':
                        if (uiString)
                            return 'face_x_position';

                        //this._isStatic = false;
                        return 'this._device.facePositionX';

                    case 'FACE_Y_POSITION':
                        if (uiString)
                            return 'face_y_position';

                        //this._isStatic = false;
                        return 'this._device.facePositionY';

                        //sprite
                    case 'OBJECT_BRIGHTNESS':
                        if (uiString)
                            return 'brightness';

                        //this._isStatic = false;
                        return 'this._sprite.brightness';

                    case 'OBJECT_GHOSTEFFECT':
                        if (uiString)
                            return 'transparency';

                        //this._isStatic = false;
                        return 'this._sprite.transparency';

                    case 'OBJECT_LAYER':
                        if (uiString)
                            return 'layer';

                        //this._isStatic = false;
                        return 'this._sprite.layer';

                    case 'OBJECT_ROTATION': //=direction
                        if (uiString)
                            return 'direction';

                        //this._isStatic = false;
                        return 'this._sprite.direction';

                    case 'OBJECT_SIZE':
                        if (uiString)
                            return 'size';

                        //this._isStatic = false;
                        return 'this._sprite.size';

                    case 'OBJECT_X':
                        if (uiString)
                            return 'position_x';

                        //this._isStatic = false;
                        return 'this._sprite.positionX';

                    case 'OBJECT_Y':
                        if (uiString)
                            return 'position_y';

                        //this._isStatic = false;
                        return 'this._sprite.positionY';

                    default:
                        throw new Error('formula parser: unknown sensor: ' + jsonFormula.value);
                }
            },
            dispose: function () {
                //override as a static class cannot be disposed
            },
        });

        return FormulaParser;
    })(),

});

//static class: constructor override (keeping code coverage enabled)
PocketCode.FormulaParser = new PocketCode.FormulaParser();

