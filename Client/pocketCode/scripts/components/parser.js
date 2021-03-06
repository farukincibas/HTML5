﻿/// <reference path="../../../smartJs/sj.js" />
/// <reference path="../core.js" />
/// <reference path="../model/bricksCore.js" />
/// <reference path="../model/bricksControl.js" />
/// <reference path="../model/bricksSound.js" />
/// <reference path="../model/bricksMotion.js" />
/// <reference path="../model/bricksSound.js" />
/// <reference path="../model/bricksData.js" />
/// <reference path="../model/userVariable.js" />
/// <reference path="../component/sprite.js" />
'use strict';

PocketCode.merge({

    SpriteFactory: (function () {
        SpriteFactory.extends(SmartJs.Core.Component);

        function SpriteFactory(device, project, broadcastMgr, soundMgr, totalCount, minLoopCycleTime) {
            //this._bricksCount = bricksCount || 0;
            this._program = project;
            this._brickFactory = new PocketCode.BrickFactory(device, project, broadcastMgr, soundMgr, totalCount, minLoopCycleTime);

            //we use the brickFactory events here
            this._onProgressChange = this._brickFactory.onProgressChange;
            this._onUnsupportedBricksFound = this._brickFactory.onUnsupportedBricksFound;
        }

        //events
        Object.defineProperties(SpriteFactory.prototype, {
            onProgressChange: {
                get: function () { return this._onProgressChange; },
            },
            onUnsupportedBricksFound: {
                get: function () { return this._onUnsupportedBricksFound; },
            },
        });

        //methods
        SpriteFactory.prototype.merge({
            create: function (jsonSprite) {
                if (typeof jsonSprite !== 'object' || jsonSprite instanceof Array)
                    throw new Error('invalid argument: expected type: object');

                var sprite = new PocketCode.Model.Sprite(this._program, jsonSprite);
                var scripts = [];
                for (var i = 0, l = jsonSprite.scripts.length; i < l; i++) {
                    scripts.push(this._brickFactory.create(sprite, jsonSprite.scripts[i]));
                }
                sprite.scripts = scripts;
                return sprite;
            },
            dispose: function () {
                this._program = undefined;
                SmartJs.Core.Component.prototype.dispose.call(this);
            },
        });

        return SpriteFactory;
    })(),


    BrickFactory: (function () {
        BrickFactory.extends(SmartJs.Core.Component);

        function BrickFactory(device, project, broadcastMgr, soundMgr, totalCount, minLoopCycleTime) {
            this._device = device;
            this._project = project;
            this._broadcastMgr = broadcastMgr;
            this._soundMgr = soundMgr;
            this._minLoopCycleTime = minLoopCycleTime;

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
                    //in development
                    case 'WhenCollisionBrick':
                    case 'SetPhysicsObjectTypeBrick':
                    case 'SetVelocityBrick':
                    case 'TurnLeftSpeedBrick':
                    case 'TurnRightSpeedBrick':
                    case 'SetGravityBrick':
                    case 'SetMassBrick':
                    case 'SetBounceFactorBrick':
                    case 'SetFrictionBrick':

                    case 'SelectCameraBrick':
                    case 'CameraBrick':
                    case 'SetCameraTransparencyBrick':

                    case 'UserScriptBrick':
                    case 'CallUserScriptBrick':

                    case 'PlaySoundAndWaitBrick':
                    case 'SpeakAndWaitBrick':
                        brick = new PocketCode.Model.UnsupportedBrick(this._device, currentSprite, jsonBrick);
                        break;
                        //^^ in development: delete/comment out bricks for testing purpose (but do not push these changes until you've finished implementation + testing)

                    case 'WhenProgramStartBrick':
                        brick = new PocketCode.Model[type](this._device, currentSprite, jsonBrick, this._project.onProgramStart);
                        break;

                    case 'WhenActionBrick':
                        switch (jsonBrick.action) {
                            case 'Tapped':
                                brick = new PocketCode.Model[type](this._device, currentSprite, jsonBrick, this._project.onSpriteTabbedAction);
                                break;
                            case 'TouchStart':
                                brick = new PocketCode.Model[type](this._device, currentSprite, jsonBrick, this._project.onTouchStartAction);
                                break;
                        }
                        break;

                    //case 'ResetTimerBrick':
                    //    brick = new PocketCode.Model[type](this._device, currentSprite, this._project.projectTimer);
                    //    break;

                    case 'WhenBroadcastReceiveBrick':
                    case 'BroadcastBrick':
                    case 'BroadcastAndWaitBrick':
                        brick = new PocketCode.Model[type](this._device, currentSprite, this._broadcastMgr, jsonBrick);
                        break;

                    case 'PlaySoundBrick':
                    case 'StopAllSoundsBrick':
                    case 'SetVolumeBrick':
                    case 'ChangeVolumeBrick':
                    case 'SpeakBrick':
                        brick = new PocketCode.Model[type](this._device, currentSprite, this._soundMgr, jsonBrick);
                        break;

                    case 'ForeverBrick':
                        brick = new PocketCode.Model[type](this._device, currentSprite, this._minLoopCycleTime);
                        break;

                    case 'WaitUntilBrick':
                    case 'RepeatBrick':
                    case 'RepeatUntilBrick':
                        brick = new PocketCode.Model[type](this._device, currentSprite, jsonBrick, this._minLoopCycleTime);
                        break;

                    default:
                        if (PocketCode.Model[type])
                            brick = new PocketCode.Model[type](this._device, currentSprite, jsonBrick);
                        else {
                            brick = new PocketCode.Model.UnsupportedBrick(this._device, currentSprite, jsonBrick);
                        }
                }

                if (brick instanceof PocketCode.Model.UnsupportedBrick)
                    this._unsupportedBricks.push(brick);


                //load sub bricks
                if (!(brick instanceof PocketCode.Model.UnsupportedBrick)) {
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
                //if (brick instanceof PocketCode.Model.ScriptBlock) {
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
                return new PocketCode.Model.BrickContainer(bricks);
            },
            _updateProgress: function () {
                var progress = 100.0 / this._total * this._parsed;
                //we do not want to trigger several hundred progress updates.. every 5% should be enough
                if (this._total === this._parsed || (progress - this._updatePercentage) >= 5.0) {
                    this._updatePercentage = progress;
                    progress = Math.round(progress * 10) / 10;  //show only one decimal place
                    this._onProgressChange.dispatchEvent({ progress: progress });
                }

            },
            dispose: function () {
                this._device = undefined;
                this._project = undefined;
                this._broadcastMgr = undefined;
                this._soundMgr = undefined;
                SmartJs.Core.Component.prototype.dispose.call(this);
            }
        });

        return BrickFactory;
    })(),


    FormulaParser: (function () {
        function FormulaParser() {
            this._isStatic = false;
        }

        FormulaParser.prototype.merge({
            getUiString: function (jsonFormula, variableNames, listNames) {
                if (typeof variableNames !== 'object')
                    throw new Error('invalid argument: variableNames (lookup dictionary required)');
                if (typeof listNames !== 'object')
                    throw new Error('invalid argument: listNames (lookup dictionary required)');
                this._variableNames = variableNames;
                this._listNames = listNames;

                return this._parseJsonType(jsonFormula, true);
            },
            parseJson: function (jsonFormula) {
                this._isStatic = true;
                var formulaString = this._parseJsonType(jsonFormula);
                return {
                    calculate: new Function(
                        'uvh',
                        'this._userVariableHost = (uvh instanceof PocketCode.UserVariableHost) ? uvh : this._sprite;' +
                        'return ' + formulaString + ';'),
                    isStatic: this._isStatic
                };
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
                        if (uiString)
                            return jsonFormula.value;

                        var num = Number(jsonFormula.value);
                        if (isNaN(num))
                            throw new Error('invalid operator/type \'number\': string to number conversion failed');
                        return num;

                    case 'SENSOR':
                        this._isStatic = false;
                        return this._parseJsonSensor(jsonFormula, uiString);

                    case 'USER_VARIABLE':
                        if (uiString) {
                            var variable = this._variableNames[PocketCode.UserVariableScope.PROCEDURE][jsonFormula.value] ||
                                this._variableNames[PocketCode.UserVariableScope.LOCAL][jsonFormula.value] ||
                                this._variableNames[PocketCode.UserVariableScope.GLOBAL][jsonFormula.value];
                            return '"' + variable.name + '"';
                        }

                        this._isStatic = false;
                        return 'this._userVariableHost.getVariable("' + jsonFormula.value + '").value';

                    case 'USER_LIST':
                        if (uiString) {
                            var list = this._listNames.local[jsonFormula.value] || this._listNames.global[jsonFormula.value];
                            return '*' + list.name + '*';
                        }

                        this._isStatic = false;
                        return 'this._userVariableHost.getList("' + jsonFormula.value + '")';

                    case 'BRACKET':
                        //if (!jsonFormula.right)
                        //    return '()';

                        return '(' + this._parseJsonType(jsonFormula.right, uiString) + ')';

                    case 'STRING':
                        //if (uiString)
                        return '\'' + jsonFormula.value.replace(/'/g, '\\\'').replace(/\n/g, '\\n') + '\'';

                    default:
                        throw new Error('formula parser: unknown type: ' + jsonFormula.type);     //TODO: do we need an onError event? -> new and unsupported operators?
                }
            },

            _concatOperatorFormula: function (jsonFormula, operator, uiString, numeric) {
                //if (uiString || !numeric)
                return this._parseJsonType(jsonFormula.left, uiString) + operator + this._parseJsonType(jsonFormula.right, uiString);

                //return 'this._validateNumeric(' + this._parseJsonType(jsonFormula.left, uiString) + ', \'' + operator + '\', ' + this._parseJsonType(jsonFormula.right, uiString) + ')';
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
                        return this._concatOperatorFormula(jsonFormula, ' + ', uiString, true);

                    case 'MINUS':
                        if (jsonFormula.left === null)    //singed number
                            return this._concatOperatorFormula(jsonFormula, '-', uiString);
                        return this._concatOperatorFormula(jsonFormula, ' - ', uiString, jsonFormula.left !== null);

                    case 'MULT':
                        if (uiString)
                            return this._concatOperatorFormula(jsonFormula, ' x ', uiString, true);
                        return this._concatOperatorFormula(jsonFormula, ' * ', uiString, true);

                    case 'DIVIDE':
                        if (uiString)
                            return this._concatOperatorFormula(jsonFormula, ' ÷ ', uiString, true);
                        return this._concatOperatorFormula(jsonFormula, ' / ', uiString, true);

                        //case 'POW':
                        //    return 'Math.pow(' + this._concatOperatorFormula(jsonFormula, ', ') + ')';

                    case 'LOGICAL_NOT':
                        if (uiString)
                            return ' NOT ' + this._parseJsonType(jsonFormula.right, uiString);
                        return '!' + this._parseJsonType(jsonFormula.right);

                    default:
                        throw new Error('formula parser: unknown operator: ' + jsonFormula.value);  //TODO: do we need an onError event? -> new and unsupported operators?
                }
            },

            _parseJsonFunction: function (jsonFormula, uiString) {
                /* package org.catrobat.catroid.formulaeditor: enum Functions
                *  SIN, COS, TAN, LN, LOG, PI, SQRT, RAND, ABS, ROUND, MOD, ARCSIN, ARCCOS, ARCTAN, EXP, FLOOR, CEIL, MAX, MIN, TRUE, FALSE, LENGTH, LETTER, JOIN;
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

                    case 'PI':
                        if (uiString)
                            return 'pi';
                        return 'Math.PI';

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

                        var stmt = '((' + lString + ' <= ' + rString + ') ? ';
                        stmt += '((' + lString + ' % 1 === 0 && ' + rString + ' % 1 === 0) ? (Math.floor(Math.random() * (' + rString + '+ 1 -' + lString + ') + ' + lString + ')) : (Math.random() * (' + rString + '-' + lString + ') + ' + lString + ')) : ';
                        stmt += '((' + lString + ' % 1 === 0 && ' + rString + ' % 1 === 0) ? (Math.floor(Math.random() * (' + lString + '+ 1 -' + rString + ') + ' + rString + ')) : (Math.random() * (' + lString + '-' + rString + ') + ' + rString + ')))';
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

                    case 'ABS':
                        if (uiString)
                            return 'abs(' + this._parseJsonType(jsonFormula.left, uiString) + ')';
                        return 'Math.abs(' + this._parseJsonType(jsonFormula.left) + ')';

                    case 'ROUND':
                        if (uiString)
                            return 'round(' + this._parseJsonType(jsonFormula.left, uiString) + ')';
                        return 'Math.round(' + this._parseJsonType(jsonFormula.left) + ')';

                    case 'MOD':
                        if (uiString)
                            return 'mod(' + this._parseJsonType(jsonFormula.left, uiString) + ', ' + this._parseJsonType(jsonFormula.right, uiString) + ')';
                        return '(' + this._parseJsonType(jsonFormula.left) + ') % (' + this._parseJsonType(jsonFormula.right) + ')';

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

                    case 'FLOOR':
                        if (uiString)
                            return 'floor(' + this._parseJsonType(jsonFormula.left, uiString) + ')';
                        return 'Math.floor(' + this._parseJsonType(jsonFormula.left) + ')';

                    case 'CEIL':
                        if (uiString)
                            return 'ceil(' + this._parseJsonType(jsonFormula.left, uiString) + ')';
                        return 'Math.ceil(' + this._parseJsonType(jsonFormula.left) + ')';

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

                    //string
                    case 'LENGTH':
                        if (uiString)
                            return 'length(' + this._parseJsonType(jsonFormula.left, uiString) + ')';

                        if (jsonFormula.left)
                            return '(' + this._parseJsonType(jsonFormula.left) + ' + \'\').length';
                        return 0;

                    case 'LETTER':
                        if (uiString)
                            return 'letter(' + this._parseJsonType(jsonFormula.left, uiString) + ', ' + this._parseJsonType(jsonFormula.right, uiString) + ')';

                        var idx = Number(this._parseJsonType(jsonFormula.left)) - 1; //given index (1..n)
                        return '((' + this._parseJsonType(jsonFormula.right) + ') + \'\').charAt(' + idx + ')';

                    case 'JOIN':
                        if (uiString)
                            return 'join(' + this._parseJsonType(jsonFormula.left, uiString) + ', ' + this._parseJsonType(jsonFormula.right, uiString) + ')';

                        return '((' + this._parseJsonType(jsonFormula.left) + ') + \'\').concat((' + this._parseJsonType(jsonFormula.right) + ') + \'\')';

                    //list
                    case 'NUMBER_OF_ITEMS':
                        if (uiString)
                            return 'number_of_items(' + this._parseJsonType(jsonFormula.left, uiString) + ')';

                        this._isStatic = false;
                        return this._parseJsonType(jsonFormula.left) + '.length';

                    case 'LIST_ITEM':
                        if (uiString)
                            return 'element(' + this._parseJsonType(jsonFormula.left, uiString) + ', ' + this._parseJsonType(jsonFormula.right, uiString) + ')';

                        this._isStatic = false;
                        return this._parseJsonType(jsonFormula.right) + '.valueAt(' + this._parseJsonType(jsonFormula.left) + ')';

                    case 'CONTAINS':
                        if (uiString)
                            return 'contains(' + this._parseJsonType(jsonFormula.left, uiString) + ', ' + this._parseJsonType(jsonFormula.right, uiString) + ')';

                        this._isStatic = false;
                        return this._parseJsonType(jsonFormula.left) + '.contains(' + this._parseJsonType(jsonFormula.right) + ')';

                    //touch
                    case 'MULTI_FINGER_X':
                        if (uiString)
                            return 'screen_touch_x( ' + this._parseJsonType(jsonFormula.left, uiString) + ' )';

                        this._isStatic = false;
                        return 'this._device.getTouchX(' + this._parseJsonType(jsonFormula.left) + ')';

                    case 'MULTI_FINGER_Y':
                        if (uiString)
                            return 'screen_touch_y( ' + this._parseJsonType(jsonFormula.left, uiString) + ' )';

                        this._isStatic = false;
                        return 'this._device.getTouchY(' + this._parseJsonType(jsonFormula.left) + ')';

                    case 'MULTI_FINGER_TOUCHED':
                        if (uiString)
                            return 'screen_is_touched( ' + this._parseJsonType(jsonFormula.left, uiString) + ' )';

                        this._isStatic = false;
                        return 'this._device.isTouched(' + this._parseJsonType(jsonFormula.left) + ')';

                    //arduino
                    case 'ARDUINOANALOG':
                        if (uiString)
                            return 'arduino_analog_pin( ' + this._parseJsonType(jsonFormula.left, uiString) + ' )';

                        this._isStatic = false;
                        return 'this._device.getArduinoAnalogPin(' + this._parseJsonType(jsonFormula.left) + ')';

                    case 'ARDUINODIGITAL':
                        if (uiString)
                            return 'arduino_digital_pin( ' + this._parseJsonType(jsonFormula.left, uiString) + ' )';

                        this._isStatic = false;
                        return 'this._device.getArduinoDigitalPin(' + this._parseJsonType(jsonFormula.left) + ')';

                    default:
                        throw new Error('formula parser: unknown function: ' + jsonFormula.value);    //TODO: do we need an onError event? -> new and unsupported operators?

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

                        return 'this._device.accelerationX';

                    case 'Y_ACCELERATION':
                        if (uiString)
                            return 'acceleration_y';

                        return 'this._device.accelerationY';

                    case 'Z_ACCELERATION':
                        if (uiString)
                            return 'acceleration_z';

                        return 'this._device.accelerationZ';

                    case 'COMPASS_DIRECTION':
                        if (uiString)
                            return 'compass_direction';

                        return 'this._device.compassDirection';

                    case 'X_INCLINATION':
                        if (uiString)
                            return 'inclination_x';

                        return 'this._device.inclinationX';

                    case 'Y_INCLINATION':
                        if (uiString)
                            return 'inclination_y';

                        return 'this._device.inclinationY';

                    case 'LOUDNESS':
                        if (uiString)
                            return 'loudness';

                        return 'this._device.loudness';

                    case 'FACE_DETECTED':
                        if (uiString)
                            return 'is_face_detected';

                        return 'this._device.faceDetected';

                    case 'FACE_SIZE':
                        if (uiString)
                            return 'face_size';

                        return 'this._device.faceSize';

                    case 'FACE_X_POSITION':
                        if (uiString)
                            return 'face_x_position';

                        return 'this._device.facePositionX';

                    case 'FACE_Y_POSITION':
                        if (uiString)
                            return 'face_y_position';

                        return 'this._device.facePositionY';

                    //sprite
                    case 'OBJECT_BRIGHTNESS':
                        if (uiString)
                            return 'brightness';

                        return 'this._sprite.brightness';

                    case 'OBJECT_TRANSPARENCY':
                    case 'OBJECT_GHOSTEFFECT':
                        if (uiString)
                            return 'transparency';

                        return 'this._sprite.transparency';

                    case 'OBJECT_COLOR':
                        if (uiString)
                            return 'color';

                        return 'this._sprite.colorEffect';

                    case 'OBJECT_LAYER':
                        if (uiString)
                            return 'layer';

                        return 'this._sprite.layer';

                    case 'OBJECT_ROTATION': //=direction
                        if (uiString)
                            return 'direction';

                        return 'this._sprite.direction';

                    case 'OBJECT_SIZE':
                        if (uiString)
                            return 'size';

                        return 'this._sprite.size';

                    case 'OBJECT_X':
                        if (uiString)
                            return 'position_x';

                        return 'this._sprite.positionX';

                    case 'OBJECT_Y':
                        if (uiString)
                            return 'position_y';

                        return 'this._sprite.positionY';

                    //time(r)
                    case 'CURRENT_YEAR':    //TODO
                        if (uiString)
                            return 'year';

                        return '(new Date()).getFullYear()';

                    case 'CURRENT_MONTH':    //TODO
                        if (uiString)
                            return 'year';

                        return '(new Date()).getMonth()';

                    case 'CURRENT_DATE':    //TODO
                        if (uiString)
                            return 'year';

                        return '(new Date()).getDate()';

                    case 'CURRENT_DAY_OF_WEEK':    //TODO
                        if (uiString)
                            return 'year';

                        return '((new Date()).getDay() > 0 ? (new Date()).getDay() : 7)';

                    case 'CURRENT_HOUR':    //TODO
                        if (uiString)
                            return 'year';

                        return '(new Date()).getHours()';

                    case 'CURRENT_MINUTE':    //TODO
                        if (uiString)
                            return 'year';

                        return '(new Date()).getMinutes()';

                    case 'CURRENT_SECOND':    //TODO
                        if (uiString)
                            return 'year';

                        return '(new Date()).getSeconds()';

                    //case 'DAYS_SINCE_2000':
                    //    if (uiString)
                    //        return 'days_since_2000';

                    //    return '(new Date() - new Date(2000, 0, 1, 0, 0, 0, 0)) / 86400000';

                    //case 'TIMER':
                    //    if (uiString)
                    //        return 'timer';

                    //    return 'this._sprite.projectTimerValue';

                    //touch
                    case 'FINGER_X':
                        if (uiString)
                            return 'screen_touch_x';

                        return 'this._device.getTouchX(this._device.lastTouchIndex)';

                    case 'FINGER_Y':
                        if (uiString)
                            return 'screen_touch_y';

                        return 'this._device.getTouchY(this._device.lastTouchIndex)';

                    case 'FINGER_TOUCHED':
                        if (uiString)
                            return 'screen_is_touched';

                        return 'this._device.isTouched(this._device.lastTouchIndex)';

                    case 'LAST_FINGER_INDEX':
                        if (uiString)
                            return 'last_screen_touch_index';

                        return 'this._device.lastTouchIndex';

                    //geo location
                    case 'LATITUDE':
                        if (uiString)
                            return 'latitude';  //TODO: check UI string

                        return 'this._device.geoLatitude';

                    case 'LONGITUDE':
                        if (uiString)
                            return 'longitude';  //TODO: check UI string

                        return 'this._device.geoLongitude';

                    case 'ALTITUDE':
                        if (uiString)
                            return 'altitude';  //TODO: check UI string

                        return 'this._device.geoAltitude';

                    case 'ACCURACY':
                        if (uiString)
                            return 'accuracy';  //TODO: check UI string

                        return 'this._device.geoAccuracy';

                    //physics
                    case 'OBJECT_X_VELOCITY':
                        if (uiString)
                            return 'x_velocity';

                        return 'this._sprite.velocityX';    //TODO: physics

                    case 'OBJECT_Y_VELOCITY':
                        if (uiString)
                            return 'y_velocity';

                        return 'this._sprite.velocityY';    //TODO: physics

                    case 'OBJECT_ANGULAR_VELOCITY':
                        if (uiString)
                            return 'angular_velocity';

                        return 'this._sprite.velocityAngular';  //TODO: physics

                    //nxt
                    case 'NXT_SENSOR_1':
                        if (uiString)
                            return 'NXT_sensor_1';

                        return 'this._device.nxt1';

                    case 'NXT_SENSOR_2':
                        if (uiString)
                            return 'NXT_sensor_2';

                        return 'this._device.nxt2';

                    case 'NXT_SENSOR_3':
                        if (uiString)
                            return 'NXT_sensor_3';

                        return 'this._device.nxt3';

                    case 'NXT_SENSOR_4':
                        if (uiString)
                            return 'NXT_sensor_4';

                        return 'this._device.nxt4';

                    //phiro
                    case 'PHIRO_FRONT_LEFT':
                        if (uiString)
                            return 'phiro_front_left_sensor';

                        return 'this._device.phiroFrontLeft';

                    case 'PHIRO_FRONT_RIGHT':
                        if (uiString)
                            return 'phiro_front_right_sensor';

                        return 'this._device.phiroFrontRight';

                    case 'PHIRO_SIDE_LEFT':
                        if (uiString)
                            return 'phiro_side_left_sensor';

                        return 'this._device.phiroSideLeft';

                    case 'PHIRO_SIDE_RIGHT':
                        if (uiString)
                            return 'phiro_side_right_sensor';

                        return 'this._device.phiroSideRight';

                    case 'PHIRO_BOTTOM_LEFT':
                        if (uiString)
                            return 'phiro_bottom_left_sensor';

                        return 'this._device.phiroBottomLeft';

                    case 'PHIRO_BOTTOM_RIGHT':
                        if (uiString)
                            return 'phiro_bottom_right_sensor';

                        return 'this._device.phiroBottomRight';

                    default:
                        throw new Error('formula parser: unknown sensor: ' + jsonFormula.value);      //TODO: do we need an onError event? -> new and unsupported operators? PHIRO?
                }
            },
            /* override */
            dispose: function () {
                //static class: cannot be disposed
            },
        });

        return FormulaParser;
    })(),

});

//static class: constructor override (keeping code coverage enabled)
PocketCode.FormulaParser = new PocketCode.FormulaParser();

