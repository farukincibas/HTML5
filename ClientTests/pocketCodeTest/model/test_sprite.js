/// <reference path="../../qunit/qunit-1.23.0.js" />
/// <reference path="../../../Client/smartJs/sj-event.js" />
/// <reference path="../../../Client/pocketCode/scripts/model/bricksCore.js" />
/// <reference path="../../../Client/pocketCode/scripts/model/bricksControl.js" />
/// <reference path="../../../Client/pocketCode/scripts/components/device.js" />
/// <reference path="../../../Client/pocketCode/scripts/component/sprite.js" />
/// <reference path="../../../Client/pocketCode/scripts/components/gameEngine.js" />
'use strict';

QUnit.module("model/sprite.js");

QUnit.test("Sprite offsets", function (assert) {
    var testsDone = assert.async();

    var onLoadHandler = function () {
        var looks = [{ id: "s_1", resourceId: "s1", name: "look1" }, { id: "s_2", resourceId: "s2", name: "look2" }];
        var sprite = new PocketCode.Model.Sprite(gameEngine, {id: "id", name: "sprite", looks: looks });
        sprite.initLooks();
        sprite.init();

        var rotationAngle = 180;
        sprite.setDirection(rotationAngle);
        assert.equal(sprite._lookOffsetX.toFixed(2), 3, "lookOffsetX calculated correctly after setting direction to 180 degrees");
        assert.equal(sprite._lookOffsetY.toFixed(2), 0, "lookOffsetY calculated correctly after setting direction to 180 degrees");

        var center,convertedAngle;
        for (rotationAngle = 0; rotationAngle <= 360; rotationAngle += 36) {
            sprite.setDirection(rotationAngle);
            center = sprite._currentLook.center;//is.getImage(sprite._currentLook.imageId).center;
            convertedAngle = (sprite._direction - 90.0) * Math.PI / 180.0;
            assert.equal(sprite._lookOffsetX.toFixed(2), (center.length * Math.cos(center.angle - convertedAngle)).toFixed(2) , "lookOffsetX calculated correctly after setting direction to " + rotationAngle + " degrees");
            assert.equal(sprite._lookOffsetY.toFixed(2), (center.length * Math.sin(center.angle - convertedAngle)).toFixed(2), "lookOffsetY calculated correctly after setting direction to " + rotationAngle + " degrees");
        }
        sprite.setLook("s_2");
        center = sprite._currentLook.center;//is.getImage(sprite._currentLook.imageId).center;
        convertedAngle = (sprite._direction - 90.0) * Math.PI / 180.0;
        assert.equal(sprite._lookOffsetX.toFixed(2), (center.length * Math.cos(center.angle - convertedAngle)).toFixed(2) , "lookOffsetX calculated correctly after look change");
        assert.equal(sprite._lookOffsetY.toFixed(2), (center.length * Math.sin(center.angle - convertedAngle)).toFixed(2), "lookOffsetY calculated correctly after look change");

        testsDone();
    };

    var is = new PocketCode.ImageStore(),
        baseUrl = "_resources/images/",
        images = [
            { id: "s1", url: "imgHelper17.png", size: 1 },
            { id: "s2", url: "imgHelper18.png", size: 1 }
        ];

    var gameEngine = new PocketCode.GameEngine();
    gameEngine._imageStore = is;
    is.onLoad.addEventListener(new SmartJs.Event.EventListener(onLoadHandler));
    is.loadImages(baseUrl, images, 1);

});

QUnit.test("Sprite", function (assert) {

    var programExecAsync = assert.async();
    var testsExecAsync = assert.async();
    var finalAsyncCall = assert.async();
    var asyncCalls = 0; //check all async calls where executed before running dispose

    var prog = new PocketCode.GameEngine();

    var sprite = new PocketCode.Model.Sprite(prog, {id: "newId", name: "myName"});
    assert.ok(sprite instanceof PocketCode.Model.Sprite && sprite instanceof PocketCode.UserVariableHost && sprite instanceof SmartJs.Core.Component, "instance check");

    //dispose: this is called after the last async test to avoid errors 
    var disposeTest = function () {
        if (asyncCalls < 2)
            return;
        sprite.dispose();
        assert.ok(sprite._disposed, "sprite disposed");
        finalAsyncCall();
    };

    //attach listener to get latest changes
    var lastOnChangeArgs;
    var onChangeHandler = function (e) {
        lastOnChangeArgs = e.properties;
    };
    sprite._onChange.addEventListener(new SmartJs.Event.EventListener(onChangeHandler, this));

    //properties
    assert.throws(function () { var err = new PocketCode.Model.Sprite(prog); }, Error, "missing ctr arguments");
    assert.equal(sprite.id, "newId", "id ctr setter");
    assert.equal(sprite.name, "myName", "name ctr setter");

    assert.throws(function () { sprite.looks = undefined; }, Error, "ERROR: setting looks");
    var looks = [{ id: 1, imageId: "s1", name: "name1" }, { id: 2, imageId: "s2", name: "name2" }];
    sprite.looks = looks;
    assert.ok(sprite._looks[0].id === looks[0].id && sprite._looks[1].id === looks[1].id, "looks setter");
    assert.ok(sprite._looks[0] instanceof PocketCode.Model.Look && sprite._looks[1] instanceof PocketCode.Model.Look, "looks setter: instances");
    assert.equal(sprite.currentLook.id, looks[0].id, "current look getter");

    assert.equal(sprite.size, 100, "size (percentage) initial");
    assert.equal(sprite.visible, true, "visibility initial");
    assert.equal(sprite.transparency, 0, "transparency initial");
    assert.equal(sprite.brightness, 100, "brighness initial");

    //events
    //assert.ok(sprite.onChange instanceof SmartJs.Event.Event, "event: onChange accessor and instance");
    //assert.equal(sprite.onChange, prog.onSpriteUiChange, "program - sprite event sharing");
    //assert.equal(sprite.onChange.target, prog, "onSpriteUiChange target check");

    //assert.ok(sprite.onExecuted === sprite._onExecuted && sprite.onExecuted instanceof SmartJs.Event.Event, "event: onExecuted accessor and instance");

    //var props = { direction: 90 };
    //var onChangeHandler = function (e) {
    //    assert.equal(e.target, evSprite, "onChange target check");
    //    assert.equal(e.id, "newId", " onChange id check");
    //    assert.deepEqual(e.properties, props, "onChange event args properties check");
    //};
    //var prog2 = new PocketCode.GameEngine();
    //var evSprite = new PocketCode.Model.Sprite(prog2, { id: "newId", name: "myName" })
    //evSprite.onChange.addEventListener(new SmartJs.Event.EventListener(onChangeHandler, this));

    //evSprite._triggerOnChange(props);


    sprite = new PocketCode.Model.Sprite(prog, { id: "newId", name: "myName" });
    var returnVal;

    // ********************* GraphicEffects *********************
    assert.throws(function () { sprite.setGraphicEffect(PocketCode.GraphicEffect.BRIGHTNESS, "asdf") }, Error, "invalid brightness percentage");
    assert.throws(function () { sprite.setGraphicEffect(null, 50) }, Error, "unknown graphic effect");

    sprite.setGraphicEffect(PocketCode.GraphicEffect.BRIGHTNESS, 210);
    assert.equal(sprite._brightness, 200, "set brightness over 200");
    sprite.setGraphicEffect(PocketCode.GraphicEffect.BRIGHTNESS, -210);
    assert.equal(sprite._brightness, 0, "set brightness under 0");

    returnVal = sprite.setGraphicEffect(PocketCode.GraphicEffect.GHOST, 110);
    assert.equal(sprite._transparency, 100.0, "set transparency over 100");
    assert.ok(returnVal, "update: transparency");
    returnVal = sprite.setGraphicEffect(PocketCode.GraphicEffect.GHOST, 110);
    assert.ok(!returnVal, "update: transparency: not changed");

    sprite.setGraphicEffect(PocketCode.GraphicEffect.GHOST, -110);
    assert.equal(sprite._transparency, 0.0, "set transparency under 0");


    assert.throws(function () { sprite.changeGraphicEffect(PocketCode.GraphicEffect.BRIGHTNESS, "asdf") }, Error, "ERROR: invalid brightness percentage");
    assert.throws(function () { sprite.changeGraphicEffect(null, 50) }, Error, "ERROR: unknown graphic effect");

    sprite.setGraphicEffect(PocketCode.GraphicEffect.BRIGHTNESS, 100);
    assert.ok(!sprite.setGraphicEffect(PocketCode.GraphicEffect.BRIGHTNESS, 100), "set grafic effect: no change to brightness");
    assert.throws(function () { sprite.setGraphicEffect(PocketCode.GraphicEffect.BRIGHTNESS); }, Error, "ERROR: set grafic effect: missing argument brightness");

    sprite.changeGraphicEffect(PocketCode.GraphicEffect.BRIGHTNESS, 110);
    assert.equal(sprite._brightness, 200, "change brightness over 200");
    sprite.setGraphicEffect(PocketCode.GraphicEffect.BRIGHTNESS, 100);
    sprite.changeGraphicEffect(PocketCode.GraphicEffect.BRIGHTNESS, -110);
    assert.equal(sprite._brightness, 0, "change brightness under 0");
    returnVal = sprite.changeGraphicEffect(PocketCode.GraphicEffect.BRIGHTNESS, -110);
    assert.ok(!returnVal, "set brightness: no update on value");

    sprite.setGraphicEffect(PocketCode.GraphicEffect.GHOST, 50);
    assert.ok(!sprite.setGraphicEffect(PocketCode.GraphicEffect.GHOST, 50), "set grafic effect: no change to transparency");
    assert.throws(function () { sprite.setGraphicEffect("UNKNOWN", 50); }, Error, "ERROR: set grafic effect: unknown effect");
    assert.throws(function () { sprite.setGraphicEffect(PocketCode.GraphicEffect.GHOST); }, Error, "ERROR: set grafic effect: missing argument transparency");

    sprite.changeGraphicEffect(PocketCode.GraphicEffect.GHOST, 60);
    assert.equal(sprite._transparency, 100.0, "change transparency over 100");
    sprite.setGraphicEffect(PocketCode.GraphicEffect.GHOST, 50);
    returnVal = sprite.changeGraphicEffect(PocketCode.GraphicEffect.GHOST, -60);
    assert.equal(sprite._transparency, 0.0, "change transparency under 0");
    assert.ok(returnVal, "change transparency: return value");
    returnVal = sprite.changeGraphicEffect(PocketCode.GraphicEffect.GHOST, -60);
    assert.ok(!returnVal, "change transparency: return value (no change)");

    sprite.setGraphicEffect(PocketCode.GraphicEffect.GHOST, 50);
    assert.equal(sprite._transparency, 50.0, "set transparency");
    sprite.changeGraphicEffect(PocketCode.GraphicEffect.GHOST, 10);
    assert.equal(sprite._transparency, 60.0, "change transparency");


    sprite.setGraphicEffect(PocketCode.GraphicEffect.BRIGHTNESS, 50);
    assert.equal(sprite._brightness, 50.0, "set brightness");
    sprite.changeGraphicEffect(PocketCode.GraphicEffect.BRIGHTNESS, 60);
    assert.equal(sprite._brightness, 110, "change brightness");

    returnVal = sprite.setGraphicEffect(PocketCode.GraphicEffect.FISHEYE, 50);
    assert.ok(!returnVal, "setting an undefined effect");
    returnVal = sprite.changeGraphicEffect(PocketCode.GraphicEffect.MOSAIC, 60);
    assert.ok(!returnVal, "changing an undefined effect");

    returnVal = sprite.clearGraphicEffects();
    assert.ok(sprite._brightness == 100 && sprite._transparency == 0, "graphic effects cleared");
    assert.ok(returnVal, "clear graphic effect: retrun value");
    returnVal = sprite.clearGraphicEffects();
    assert.ok(!returnVal, "clear graphic effect: retrun value (no updates)");

    // *************************************************************

    // ********************* show/hide *********************
    returnVal = sprite.show();
    assert.ok(sprite._visible, "show sprite");
    assert.ok(!returnVal, "call show() on visisble sprite: return value");
    returnVal = sprite.hide();
    assert.ok(!sprite._visible, "show sprite");
    assert.ok(returnVal, "call hide() on invisisble sprite: return value");
    assert.ok(lastOnChangeArgs.visible !== undefined, "visibility event args");
    sprite.hide();
    sprite.show();
    assert.ok(sprite._visible, "show sprite");
    // *************************************************************

    // ********************* Constructor *********************

    var device = new PocketCode.Device(this._soundManager);
    prog._brickFactory = new PocketCode.BrickFactory(device, prog, prog._broadcastMgr, prog._soundManager, 20);

    var jsonProject = JSON.parse(JSON.stringify(projectSounds));
    var jsonSprite = jsonProject.sprites[0];
    jsonSprite.sounds = jsonProject.sounds;
    jsonSprite.variables = strProject11.variables;

    var testSprite = new PocketCode.Model.Sprite(prog, jsonSprite);

    assert.deepEqual(testSprite.id, jsonSprite.id, "Id set correctly");
    assert.deepEqual(testSprite.name, jsonSprite.name, "Name set correctly");

    var varsMatch = true;
    for (var i = 0, length = jsonSprite.variables.length; i < length; i++) {
        //if (!testSprite.__variablesSimple._variables[jsonSprite.variables[i].id] === jsonSprite.variables[i].id)
        if (testSprite.getVariable(jsonSprite.variables[i].id)._id !== jsonSprite.variables[i].id)
            varsMatch = false;
    }
    assert.ok(varsMatch, "Variables set correctly");

    //var soundsMatch = true;
    //for (var i = 0, length = jsonSprite.sounds.length; i < length; i++) {
    //    if (!testSprite._sounds[jsonSprite.sounds[i].id])
    //        soundsMatch = false;
    //}
    //assert.ok(soundsMatch, "Sounds set correctly");
    assert.equal(testSprite.sounds, jsonSprite.sounds, "Sounds set correctly");

    var bricksMatch = true;
    for (var i = 0, length = jsonSprite.scripts.length; i < length; i++) {
        if (testSprite._scripts[i].imageId !== jsonSprite.scripts[i].id)
            bricksMatch = false;
    }
    assert.ok(bricksMatch, "Bricks set correctly");

    var looksMatch = true;
    for (var i = 0, length = jsonSprite.looks.length; i < length; i++) {
        if (testSprite._looks[i].id !== jsonSprite.looks[i].id)
            looksMatch = false;
    }
    assert.ok(looksMatch, "Looks set correctly");

    //mock gameEngines getLookImage function
    var initialScaling = 50;
    var canvas = "canvas";
    testSprite._gameEngine.getLookImage = function () {
        return {
            canvas: canvas,
            initialScaling: initialScaling
        }
    };

    testSprite._flipX = false;
    var lookOffsetX = 1;
    var lookOffsetY = 2;
    testSprite._lookOffsetX = lookOffsetX;
    testSprite._lookOffsetY = lookOffsetY;

    var renderingProperties = testSprite.renderingProperties;

    assert.strictEqual(renderingProperties.id, testSprite.id, "renderingProperties: id set correctly");
    assert.strictEqual(renderingProperties.x, testSprite._positionY + lookOffsetX, "renderingProperties: x set correctly");
    assert.strictEqual(renderingProperties.y, testSprite._positionY + lookOffsetY, "renderingProperties: y set correctly");
    assert.strictEqual(renderingProperties.rotation, testSprite._direction - 90, "renderingProperties: rotation set correctly");
    assert.strictEqual(renderingProperties.flipX, testSprite._flipX, "renderingProperties: flipX set correctly");
    assert.strictEqual(renderingProperties.scaling, 1/initialScaling, "renderingProperties: scaling set correctly");
    assert.strictEqual(renderingProperties.visible, testSprite._visible, "renderingProperties: visible set correctly");
    assert.strictEqual(renderingProperties.look, canvas, "renderingProperties: look set correctly");

    var graphicEffectsSet = renderingProperties.graphicEffects && renderingProperties.graphicEffects instanceof Array;
    assert.ok(graphicEffectsSet, "renderingProperties: graphicEffects created as array");
    if(graphicEffectsSet){
        var ghostSet = 0;
        var brightnessSet = 0;
        for(var i = 0, l = renderingProperties.graphicEffects.length; i < l; i++){
            if(renderingProperties.graphicEffects[i].effect === PocketCode.GraphicEffect.GHOST){
                ghostSet++;
                assert.equal(renderingProperties.graphicEffects[i].value, testSprite._transparency, "renderingProperties: ghost set correctly");
            } else if(renderingProperties.graphicEffects[i].effect === PocketCode.GraphicEffect.BRIGHTNESS){
                brightnessSet++;
                assert.equal(renderingProperties.graphicEffects[i].value, testSprite._brightness - 100, "renderingProperties: brightness set correctly");
            }
        }
    }

    testSprite._currentLook = null;
    renderingProperties = testSprite.renderingProperties;
    assert.strictEqual(renderingProperties.x, testSprite._positionX, "renderingProperties: x set correctly without currentLook");
    assert.strictEqual(renderingProperties.y, testSprite._positionY, "renderingProperties: y set correctly without currentLook");
    assert.strictEqual(renderingProperties.scaling, 1, "renderingProperties: scaling set correctly without currentLook");
    assert.ok(!renderingProperties.look, "renderingProperties: no look set if there is no current look");

    var rotationStyle = "someRotationStyle";
    testSprite._rotationStyle = rotationStyle;
    assert.strictEqual(testSprite.rotationStyle, rotationStyle, "rotationStyle getter works as expected");

    var corruptSprite = JSON.parse(JSON.stringify(projectSounds.sprites[0]));
    corruptSprite.scripts = {};
    assert.throws(function () { new PocketCode.Model.Sprite(prog, corruptSprite); }, Error, "Error: incorrect argument for bricks.");

    corruptSprite = JSON.parse(JSON.stringify(projectSounds.sprites[0]));
    corruptSprite.sounds = {};
    assert.throws(function () { new PocketCode.Model.Sprite(prog, corruptSprite); }, Error, "Error: incorrect argument for sounds.");

    corruptSprite = JSON.parse(JSON.stringify(projectSounds.sprites[0]));
    corruptSprite.variables = {};
    assert.throws(function () { new PocketCode.Model.Sprite(prog, corruptSprite); }, Error, "Error: incorrect argument for variables.");

    corruptSprite = JSON.parse(JSON.stringify(projectSounds.sprites[0]));
    corruptSprite.looks = {};
    assert.throws(function () { new PocketCode.Model.Sprite(prog, corruptSprite); }, Error, "Error: incorrect argument for looks.");


    // *************************************************************

    // ********************* Size *********************
    assert.throws(function () { sprite.setSize("asdf") }, Error, "invalid percentage");

    sprite.setSize(0);
    assert.ok(!sprite.setSize(-20), "size not changed: 0");
    sprite.setSize(100);
    assert.ok(!sprite.setSize(100), "size not changed: same size");
    sprite.setSize(-20);
    assert.equal(sprite._size, 0, "set size below 0");
    returnVal = sprite.setSize(50);
    assert.equal(sprite._size, 50, "set size");
    assert.ok(returnVal, "set size return val");
    assert.ok(lastOnChangeArgs.scaling !== undefined, "set size event args");

    returnVal = sprite.changeSize(-60);
    assert.equal(sprite._size, 0, "change size below 0");
    assert.ok(returnVal, "change size: changed");
    assert.ok(lastOnChangeArgs.scaling !== undefined, "change size event args");

    sprite.changeSize(20);
    assert.equal(sprite._size, 20, "change size upwards");
    sprite.changeSize(15);
    sprite.changeSize(20);
    assert.equal(sprite._size, 55, "double change size");
    assert.throws(function () { sprite.changeSize(); }, Error, "ERROR: missing argument");
    lastOnChangeArgs = undefined;
    returnVal = sprite.changeSize(0);
    assert.ok(!returnVal, "change size: not changed");
    assert.ok(lastOnChangeArgs == undefined, "change size: no event dispatched");

    // *************************************************************

    // ********************* Position *********************
    returnVal = sprite.setPosition(10, 10);
    assert.ok(sprite._positionX == 10 && sprite._positionY == 10, "set Position");
    assert.ok(returnVal, "set position: update");
    assert.ok(lastOnChangeArgs.x !== undefined || lastOnChangeArgs.y !== undefined, "set position event args");
    returnVal = sprite.setPosition(10, 10);
    assert.ok(returnVal == false, "set position: no change");

    returnVal = sprite.setPositionY(90);
    assert.ok(sprite._positionX == 10 && sprite._positionY == 90, "set PositionY");
    assert.ok(returnVal, "set positionY: update");
    assert.ok(lastOnChangeArgs.y !== undefined, "set positionY event args");
    returnVal = sprite.setPositionY(90);
    assert.ok(returnVal == false, "set positionY: no change");

    returnVal = sprite.setPositionX(35);
    assert.ok(sprite._positionX == 35 && sprite._positionY == 90, "set PositionX");
    assert.ok(returnVal, "set positionX: update");
    assert.ok(lastOnChangeArgs.x !== undefined, "set positionX event args");
    returnVal = sprite.setPositionX(35);
    assert.ok(returnVal == false, "set positionX: no change");

    returnVal = sprite.changePositionX(50);
    assert.ok(sprite._positionX == 35 + 50 && sprite._positionY == 90, "change PositionX");
    assert.ok(returnVal, "change positionX: change");
    assert.ok(lastOnChangeArgs.x !== undefined, "chagne positionX event args");
    assert.ok(sprite.changePositionX(0) == false, "change positionX: no change");
    returnVal = sprite.changePositionY(-20);
    assert.ok(sprite._positionX == 35 + 50 && sprite._positionY == 90 - 20, "change PositionY");
    assert.ok(returnVal, "change positionY: change");
    assert.ok(lastOnChangeArgs.y !== undefined, "change positionY event args");
    assert.ok(sprite.changePositionY(0) == false, "change positionY: no change");
    // *************************************************************

    //if on edge, bounce
    assert.ok(typeof prog.ifSpriteOnEdgeBounce === "function", "sprite-program interface: if on edge bounce");
    var ioeCalled = false;
    prog.ifSpriteOnEdgeBounce = function () {    //override to check call
        ioeCalled = true;
    };
    sprite.ifOnEdgeBounce();
    assert.ok(ioeCalled, "if on edge bounce: call parent");

    // ********************* Move/Direction *********************
    sprite.setPosition(-10, -10);
    returnVal = sprite.move(25);
    assert.ok(sprite._positionX == 15 && sprite._positionY == -10 && sprite._direction == 90, "move steps 90°");
    assert.ok(returnVal, "move return value: true on change");
    assert.ok(lastOnChangeArgs.x !== undefined || lastOnChangeArgs.y !== undefined, "move event args");
    assert.ok(sprite.move(0) == false, "move return value: false if position did not change");

    var triggerEvent;   //undefined = true
    sprite.setDirection(0);
    returnVal = sprite.setDirection(-90, triggerEvent);
    assert.ok(returnVal, "setDirection return value");
    assert.ok(lastOnChangeArgs.rotation !== undefined, "set direction event args");
    returnVal = sprite.setDirection(-90, triggerEvent);
    assert.ok(!returnVal, "setDirection return value false (no change)");
    assert.ok(sprite.setDirection() == false, "setDirection return value false (no parameter)");
    sprite.setPosition(-10, -10);
    sprite.move(25);
    assert.ok(sprite._positionX == -35 && sprite._positionY == -10 && sprite._direction == -90, "move steps -90°");

    sprite.setDirection(-180, triggerEvent);
    sprite.setPosition(-10, -10);
    sprite.move(25);
    assert.ok(sprite._positionX == -10 && sprite._positionY == -35 && sprite._direction == 180, "move steps -180°");

    sprite.setDirection(180, triggerEvent);
    sprite.setPosition(-10, -10);
    sprite.move(25);
    assert.ok(sprite._positionX == -10 && sprite._positionY == -35 && sprite._direction == 180, "move steps 180°");

    sprite.setDirection(0, triggerEvent);
    sprite.setPosition(-10, -10);
    sprite.move(25);
    assert.ok(sprite._positionX == -10 && sprite._positionY == 15 && sprite._direction == 0, "move steps 0°");

    // *************************************************************

    // ********************* turn *********************

    sprite.setDirection(90, triggerEvent);
    sprite.turnRight(50);
    assert.equal(sprite._direction, 140, "turn right 50°");
    sprite.turnRight(570); //710 --> -10
    assert.equal(sprite._direction, -10, "turn right to 710°");
    sprite.turnRight(-180); // -190 --> 170
    assert.equal(sprite._direction, 170, "turn right to -190°");

    sprite.setDirection(90, triggerEvent);
    sprite.turnRight(100); //190 --> -170
    assert.equal(sprite._direction, -170, "turn right to 190°");
    returnVal = sprite.turnRight(180); //-170 --> 10
    assert.ok(returnVal, "turnRight returns true on update");
    assert.ok(lastOnChangeArgs.rotation !== undefined, "turn right event args");
    returnVal = sprite.turnRight(0); //-170 --> 10
    assert.ok(!returnVal, "turnRight returns false: no update");
    returnVal = sprite.turnRight(360);
    assert.ok(!returnVal, "turnRight returns false: no update (360°) turn");
    assert.ok(sprite.turnRight() == false, "turn right without parameter");

    assert.equal(sprite._direction, 10, "turn right to 10°");
    sprite.turnRight(-20); //-170 --> 10
    assert.equal(sprite._direction, -10, "turn right to 10°");
    sprite.setDirection(90, triggerEvent);
    sprite.turnRight(-100); //-10 --> -10
    assert.equal(sprite._direction, -10, "turn right to -10°");

    sprite.setDirection(0, triggerEvent);
    sprite.turnRight(-350); //-350 --> 10
    assert.equal(sprite._direction, 10, "turn right to 10°");
    sprite.setDirection(0, triggerEvent);
    sprite.turnRight(350); //350 --> -10
    assert.equal(sprite._direction, -10, "turn right to -10°");
    sprite.setDirection(0, triggerEvent);
    returnVal = sprite.turnLeft(350); //350 --> 10
    assert.ok(returnVal, "turnLeft returns true on update");
    returnVal = sprite.turnLeft(360);
    assert.ok(!returnVal, "turnLeft returns false: no update (360°) turn");
    assert.ok(sprite.turnLeft() == false, "turn left without parameter");

    assert.equal(sprite._direction, 10, "turn left to 10°");
    sprite.setDirection(0, triggerEvent);
    sprite.turnLeft(-350); //-350 --> -10
    assert.equal(sprite._direction, -10, "turn left to -10°");

    sprite.setDirection(90, triggerEvent);
    sprite.turnRight(-540); //-350 --> 10
    assert.ok(sprite._direction == -90, "turn right to -90°");
    sprite.setDirection(90, triggerEvent);
    sprite.turnRight(541); //350 --> -10
    assert.ok(sprite._direction == -89, "turn right to -89°");
    sprite.setDirection(90, triggerEvent);
    sprite.turnLeft(540); //350 --> 10
    assert.ok(sprite._direction == -90, "turn left to -90°");
    sprite.setDirection(90, triggerEvent);
    sprite.turnLeft(-541); //-350 --> -10
    assert.equal(sprite._direction, -89, "turn left to -89°");

    sprite.setDirection(-90, triggerEvent);
    sprite.turnRight(-450); //-350 --> 10
    assert.equal(sprite._direction, 180, "turn right to 180°");
    sprite.setDirection(-90, triggerEvent);
    sprite.turnRight(450); //350 --> -10
    assert.equal(sprite._direction, 0, "turn right to 0°");
    sprite.setDirection(-90, triggerEvent);
    sprite.turnLeft(450); //350 --> 10
    assert.equal(sprite._direction, 180, "turn left to 180°");
    assert.ok(lastOnChangeArgs.rotation !== undefined, "turn left event args");
    sprite.setDirection(-90, triggerEvent);
    sprite.turnLeft(-450); //-350 --> -10
    assert.equal(sprite._direction, 0, "turn left to 0°");
    //console.log("direction : "+sprite._direction);

    // *************************************************************

    // ********************* variables *********************
    var varArray = [{ id: [21], name: ["two-one"] }, { id: [24], name: ["two-four"] }];
    sprite._variables = varArray;
    assert.ok(sprite.getVariable(21).value == undefined, "correct init"); //vars have to be initialized
    //assert.equal(sprite.getVariable(21).value, 0.000001, "correct init"); //vars have to be initialized
    assert.ok(sprite.getVariable(21).name == "two-one", "correct insertion of array entries");
    assert.ok(sprite.getVariable(24).name == "two-four", "correct insertion of array entries");
    var fakeArray = "error"
    assert.throws(function () { sprite._variables = fakeArray }, Error, "passing non Array");
    var v = sprite.getVariable(21);
    assert.ok(v.name == "two-one", "get variable");
    assert.throws(function () { sprite.getVariable(22) }, Error, "unknown variable id");

    var varNames = sprite.getAllVariables();
    assert.ok(varNames.local[21].name == "two-one", "get variableNames");


    // *************************************************************

    // ********************* looks *********************
    sprite.looks = [];
    returnVal = sprite.setLook("non existing");
    assert.ok(!returnVal, "set look on nonexisting look");

    var look1 = new PocketCode.Model.Look({ name: "look1", id: "first", resourceId: "1" });//new Object();
    look1._center = { length: 0.0, angle: 0.0 };
    //look1.name = "look1";
    //look1.id = "first";
    ////look1.center = { length: 0, angle: 0 };
    var look2 = new PocketCode.Model.Look({ name: "look2", id: "second", resourceId: "2" });//new Object();
    look2._center = { length: 0.0, angle: 0.0 };
    //look2.name = "look2";
    //look2.id = "second";
    ////look2.center = { length: 0, angle: 0 };
    var looks = [];
    looks[0] = look1;
    looks[1] = look2;
    sprite.looks = looks;
    //sprite.initLooks(); //make sure looks are preprovessed
    //apply center to internal looks to run these tests
    //sprite._looks[0].center = { length: 0, angle: 0 };
    //sprite._looks[1].center = { length: 0, angle: 0 };

    assert.ok(sprite._looks[0].id === looks[0].id && sprite._looks[1].id === looks[1].id, "looks setter");
    assert.equal(sprite._looks[1].name, "look2", "set looks1");
    assert.equal(sprite._currentLook.id, "first", "set looks2");
    assert.equal(sprite._currentLook.name, "look1", "set looks3");

    returnVal = sprite.setLook("first");
    assert.ok(!returnVal, "set already active look: no change");

    //we do have to overide the gameEngine look equest to test this, as there are no looks registered
    //game engine: getLookImage
    assert.ok(typeof prog.getLookImage === "function", "sprite-program interface: get look from store");
    //prog.getLookImage = function (id) {
    //    return { canvas: new Image(), center: { length: 0, angle: 0 }, initialScaling: 0.5 };
    //};
    returnVal = sprite.setLook("second");
    assert.ok(sprite._currentLook.name == "look2", "set current look with id");
    assert.ok(returnVal, "set look: change (return value)");
    assert.ok(lastOnChangeArgs.look !== undefined, "set look event args");
    assert.throws(function () { sprite.setLook("non existing"); }, "ERROR: try to set undefined look");

    sprite.looks = [];
    returnVal = sprite.nextLook();
    assert.ok(!returnVal, "next look on nonexisting look");

    sprite.looks = looks;
    //apply center to internal looks to run these tests
    //sprite._looks[0].center = { length: 0, angle: 0 };
    //sprite._looks[1].center = { length: 0, angle: 0 };

    returnVal = sprite.setLook("second");
    returnVal = sprite.nextLook();
    assert.ok(sprite._currentLook.name == "look1", "next look");
    assert.ok(returnVal, "first look is set after last");
    assert.ok(lastOnChangeArgs.look !== undefined, "next look event args");
    returnVal = sprite.nextLook();
    assert.ok(sprite._currentLook.name == "look2", "next look 2");
    assert.ok(returnVal, "next look is set correctly");

    sprite._looks.pop();    //only one left
    returnVal = sprite.nextLook();
    assert.ok(!returnVal, "next look if only one is defined");

    looks[1] = look2;   //add again
    var look3 = new Object();
    look3.name = "look3";
    look3.id = "third";
    looks[2] = look3;
    sprite.looks = looks;
    //apply center to internal looks to run these tests
    //sprite._looks[0].center = { length: 0, angle: 0 };
    //sprite._looks[1].center = { length: 0, angle: 0 };
    //sprite._looks[2].center = { length: 0, angle: 0 };

    assert.ok(sprite._currentLook.name == "look1", "current look set back to first after look setter");
    assert.equal(sprite._looks.length, 3, "looks count increased");

    sprite.setLook("third");
    assert.ok(sprite._currentLook.name == "look3", "next look to last look");

    sprite.nextLook();
    assert.ok(sprite._currentLook.name == "look1", "look loop 1");
    sprite.nextLook();
    assert.ok(sprite._currentLook.name == "look2", "look loop 2");
    sprite.nextLook();
    assert.ok(sprite._currentLook.name == "look3", "look loop 3");
    sprite.nextLook();
    assert.ok(sprite._currentLook.name == "look1", "look loop 4 back to first");

    // *************************************************************

    // ********************* start/pause/resume/stop *********************
    //var device = new PocketCode.Device();
    var programAsync = new PocketCode.GameEngine();
    programAsync._executionState = PocketCode.ExecutionState.RUNNING;
    programAsync.getLookImage = function (id) { //override to test look center 
        return { canvas: undefined, center: { length: 0, angle: 0 }, initialScaling: 1 };
    };

    var brick1 = new PocketCode.Model.WhenProgramStartBrick(device, sprite, { x: 1, y: 2 }, programAsync.onProgramStart);
    brick1.id = "first";
    var brick2 = new PocketCode.Model.WhenProgramStartBrick(device, sprite, { x: 1, y: 2 }, programAsync.onProgramStart);
    //adding a test brick to the internal brick container
    var testBrick = new PocketCode.Model.WaitBrick(device, sprite, { duration: { type: "NUMBER", value: 0.2, right: null, left: null } });
    brick2._bricks._bricks.push(testBrick);
    var brick3 = new PocketCode.Model.WhenProgramStartBrick(device, sprite, { x: 1, y: 2 }, programAsync.onProgramStart);
    //var brick4 = new PocketCode.Model.WhenProgramStartBrick(device, sprite, { x: 1, y: 2 }, programAsync.onProgramStart);
    //var brick5 = new PocketCode.Model.WhenProgramStartBrick(device, sprite, { x: 1, y: 2 }, programAsync.onProgramStart);
    var tmpBricks = [];
    tmpBricks[0] = brick1;
    tmpBricks[1] = brick2;
    tmpBricks[2] = brick3;
    sprite.scripts = tmpBricks;
    assert.equal(sprite.scripts, tmpBricks, "bricks getter");
    assert.ok(sprite._scripts.length == 3, "bricks length");

    assert.ok(sprite.scriptsRunning == false, "scrips not running");
    brick2._executionState = PocketCode.ExecutionState.PAUSED;  //simulate paused
    assert.ok(sprite.scriptsRunning, "scrips running: paused");
    brick2._executionState = PocketCode.ExecutionState.RUNNING;  //simulate running
    assert.ok(sprite.scriptsRunning, "scrips running: running");

    //start, pause, resume, stop + executed
    //binding program events
    for (var i = 0, l = tmpBricks.length; i < l; i++) {
        tmpBricks[i].onExecuted.addEventListener(new SmartJs.Event.EventListener(programAsync._spriteOnExecutedHandler, programAsync));
    }

    var programExecutedHandler = function () {
        assert.ok(true, "program executed: all running scripts executed");

        //remove after dispatched to avoid multiple calls
        for (var i = 0, l = tmpBricks.length; i < l; i++) {
            tmpBricks[i].onExecuted.removeEventListener(new SmartJs.Event.EventListener(programAsync._spriteOnExecutedHandler, programAsync));
        }
        programExecAsync();
        asyncCalls++;
        disposeTest();  //make sure this is called last
    };
    programAsync.onProgramExecuted.addEventListener(new SmartJs.Event.EventListener(programExecutedHandler, this));
    programAsync.onProgramStart.dispatchEvent();
    assert.ok(sprite.scriptsRunning, "scrips running: onExecute (program)");

    sprite.pauseScripts();
    assert.ok(sprite.scriptsRunning, "scrips running: paused");

    //making sure the script was really paused is quite a hack here
    var isPaused = function () {
        for (var p in testBrick._pendingOps) {
            if (testBrick._pendingOps.hasOwnProperty(p)) {
                var po = testBrick._pendingOps[p];
                if (po.timer._paused !== true)
                    return false;
            }
        }
        return true;
    };

    assert.ok(isPaused(), "script paused correctly: deep check (timer)");

    sprite.resumeScripts();
    assert.ok(sprite.scriptsRunning, "scrips running: running");
    assert.ok(!isPaused(), "script resumed correctly: deep check (timer)");

    sprite.stopScripts();
    assert.ok(!sprite.scriptsRunning, "scrips running: stopped");
    assert.ok(  function () { 
                    for (var p in testBrick._pendingOps)
                        if (testBrick._pendingOps.hasOwnProperty(p))
                            return false;
                    return true;
                }, "script stopped correctly: deep check: no threaded items left");

    //start script again to get an onExecEvent in the gameEngine
    programAsync._executionState = PocketCode.ExecutionState.RUNNING;
    programAsync.onProgramStart.dispatchEvent();

    // ********************* come to front/go back *********************
    var program = new PocketCode.GameEngine();
    program.getLookImage = function (id) { //override to test look center 
        return { canvas: undefined, center: { length: 0, angle: 0 }, initialScaling: 1 };
    };

    var newSprite = new PocketCode.Model.Sprite(program, { id: "newId", name: "myName" });
    program._sprites.push(newSprite);
    var firstLayer = newSprite.layer;

    var newSprite2 = new PocketCode.Model.Sprite(program, { id: "newId", name: "myName" });
    program._sprites.push(newSprite2);

    var tmpsprite = new PocketCode.Model.Sprite(program, { id: "newId", name: "myName" });
    program._sprites.push(tmpsprite);

    newSprite.comeToFront();
    assert.ok(newSprite.layer == program._sprites.length, "come to front 1");
    tmpsprite.comeToFront();
    assert.ok(tmpsprite.layer == program._sprites.length, "come to front 2");
    newSprite2.comeToFront();
    assert.ok(newSprite2.layer == program._sprites.length, "come to front 3");

    var layerBefore = newSprite.layer;
    newSprite.goBack(2);
    assert.ok(newSprite.layer == firstLayer, "go back 2 layers");
    layerBefore = newSprite2.layer;
    newSprite2.goBack(1);
    assert.ok(newSprite2.layer == layerBefore - 1, "go back 1 layers");
    layerBefore = tmpsprite.layer;
    tmpsprite.goBack(2);
    assert.ok(tmpsprite.layer == layerBefore - 2, "go back 2 layers");
    layerBefore = tmpsprite.layer;
    tmpsprite.goBack(3);
    assert.ok(tmpsprite.layer == firstLayer, "go back 3 layers");
    // *************************************************************

    // ********************* point to *********************
    sprite._id = "id1";
    newSprite = new PocketCode.Model.Sprite(prog, { id: "newId", name: "myName" });
    newSprite._id = "id2";
    prog._sprites.push(newSprite);
    var tmp = prog.getSpriteById("id2");
    assert.ok(tmp === newSprite, "push sprite to program");

    newSprite.setPosition(100, 100);
    sprite.setPosition(50, 50);

    returnVal = sprite.pointTo();
    assert.ok(!returnVal, "pointTo: missing argument");
    returnVal = sprite.pointTo("id2");
    assert.ok(sprite.direction == 45, "point to right up sprite");
    assert.ok(returnVal, "point to: value changed");
    assert.ok(lastOnChangeArgs.rotation !== undefined, "pointTo event args");
    returnVal = sprite.pointTo("id2");
    assert.ok(!returnVal, "point to: value not changed");
    //returnVal = sprite.pointTo(sprite.id);
    //assert.ok(!returnVal, "point to: self (no change)");
    assert.throws(function () { sprite.pointTo(sprite.id); }, "ERROR: point to: self");

    newSprite.setPosition(0, 0);
    sprite.setPosition(0, 0);
    returnVal = sprite.pointTo("id2");
    assert.ok(!returnVal, "point to: sprite on same position: ignored");

    sprite.setPosition(50, 50);

    sprite.pointTo("id2");
    assert.ok(sprite.direction == -180 + 45, "point to left down sprite");
    // *************************************************************

    testsExecAsync();
    asyncCalls++;
    disposeTest();

});

QUnit.test("Sprite: ifOnEdgeBounce", function (assert) {

    assert.ok(false, "missing");
    return;

    var done1 = assert.async();
    var done2 = assert.async();

    var /*newSpritePositionX, newSpritePositionY, newSpriteDirection,*/ newSpritePositionTriggerUpdate;
    var spriteMock = {
        id: "spriteId_test",
        direction: 90,
        rotationStyle: PocketCode.RotationStyle.DO_NOT_ROTATE, /*.ALL_AROUND,*/
        positionX: -10,
        positionY: -10,
        size: 100,
        setPosition: function (x, y, triggerUpdate) {
            spriteMock.positionX = x;
            spriteMock.positionY = y;
            newSpritePositionTriggerUpdate = triggerUpdate;
        },
        setDirection: function (dir) {
            spriteMock.direction = dir;
        },
        currentLook: {
            imageId: "i1",
        },
    };
    var ga = new PocketCode.GameEngine();
    ga._originalScreenHeight = 100;
    ga._originalScreenWidth = 50;
    var sh2 = ga._originalScreenHeight / 2,
        sw2 = ga._originalScreenWidth / 2;
    var is = new PocketCode.ImageStore();
    //inject image store to load test images directly
    ga._imageStore = is;

    //init tests
    var baseUrl = "_resources/images/",
    images = [
        { id: "i1", url: "imgHelper1.png", size: 1 },
        //{ id: "i2", url: "imgHelper2.png", size: 1 },
        //{ id: "i3", url: "imgHelper3.png", size: 1 },
        //{ id: "i4", url: "imgHelper4.png", size: 1 },
        //{ id: "i5", url: "imgHelper5.png", size: 1 },
        //{ id: "i6", url: "imgHelper6.png", size: 1 },
        //{ id: "i7", url: "imgHelper7.png", size: 1 },
        //{ id: "i8", url: "imgHelper8.png", size: 1 },
        { id: "i9", url: "imgHelper9.png", size: 1 },
        { id: "i10", url: "imgHelper10.png", size: 1 },
        { id: "i11", url: "imgHelper11.png", size: 1 },
    ];


    var onLoadCount = 0;
    var onLoadHandler = function (e) {
        onLoadCount++;

        startTest();
    };
    is.onLoad.addEventListener(new SmartJs.Event.EventListener(onLoadHandler));
    is.loadImages(baseUrl, images, 0.5);

    var lastUpdateEventArgs;
    var onSpriteUpdate = function (e) {
        lastUpdateEventArgs = e;
    };
    ga.onSpriteUiChange.addEventListener(new SmartJs.Event.EventListener(onSpriteUpdate));

    var opReturn, boundary;//, overflow;

    var startTest = function () {

        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        assert.ok(opReturn == false && lastUpdateEventArgs == undefined, "simple: no change");
        assert.equal(ga.ifSpriteOnEdgeBounce(), false, "no change if no sprite is passed to method");

        //simple movements in one direction
        //left
        spriteMock.positionX = -40;
        spriteMock.positionY = 0;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        assert.ok(opReturn == true && lastUpdateEventArgs !== undefined, "simple: left overflow");
        assert.ok(lastUpdateEventArgs.properties.positionX !== undefined && lastUpdateEventArgs.properties.positionY === undefined && lastUpdateEventArgs.id == "spriteId_test", "left overflow: event argument check");
        boundary = is.getLookBoundary("spriteId_test", "i1", 1, 0, false, true);
        var overflowLeft = -spriteMock.positionX - boundary.left - sw2;
        assert.equal(overflowLeft, 0, "simple: left overflow: aligned after bounce");
        assert.equal(spriteMock.direction, 90, "left: direction not changed");
        assert.equal(spriteMock.positionY, 0, "left without direction change: y pos does not change");

        //directions
        spriteMock.positionX = -40;
        spriteMock.positionY = 0;
        spriteMock.direction = -170;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        assert.equal(spriteMock.direction, 170, "left: direction changed (-170 -> 170)");

        spriteMock.positionX = -40;
        spriteMock.positionY = 0;
        spriteMock.direction = -90;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        assert.equal(spriteMock.direction, 90, "left: direction changed (180 turn around)");

        spriteMock.positionX = -40;
        spriteMock.positionY = 0;
        spriteMock.direction = -40;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        assert.equal(spriteMock.direction, 40, "left: direction changed (-40 -> 40)");

        spriteMock.positionX = -40;
        spriteMock.positionY = 0;
        spriteMock.direction = 0;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        assert.equal(spriteMock.direction, 0, "left: direction not changed (0 = sprite direction parallel to handled edge)");

        spriteMock.positionX = -40;
        spriteMock.positionY = 0;
        spriteMock.direction = 180;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        assert.equal(spriteMock.direction, 180, "left: direction not changed (180 = sprite direction parallel to handled edge)");


        //right
        spriteMock.positionX = 40;
        spriteMock.positionY = 0;
        spriteMock.direction = 90;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        assert.ok(opReturn == true && lastUpdateEventArgs !== undefined, "simple: right overflow");
        assert.ok(lastUpdateEventArgs.properties.positionX !== undefined && lastUpdateEventArgs.properties.positionY === undefined && lastUpdateEventArgs.id == "spriteId_test", "right overflow: event argument check");
        boundary = is.getLookBoundary("spriteId_test", "i1", 1, 0, false, true);
        var overflowRight = spriteMock.positionX + boundary.right - sw2;
        assert.equal(overflowRight, 0, "simple: right overflow: aligned after bounce");
        assert.equal(spriteMock.direction, -90, "right: direction changed");
        //directions
        spriteMock.positionX = 40;
        spriteMock.positionY = 0;
        spriteMock.direction = 10;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        assert.equal(spriteMock.direction, -10, "right: direction changed (10 -> -10)");

        spriteMock.positionX = 40;
        spriteMock.positionY = 0;
        spriteMock.direction = 150;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        assert.equal(spriteMock.direction, -150, "right: direction changed (150 -> -150)");

        spriteMock.positionX = 40;
        spriteMock.positionY = 0;
        spriteMock.direction = 0;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        assert.equal(spriteMock.direction, 0, "right: direction not changed (0)");
        assert.equal(spriteMock.positionY, 0, "right without direction change: y pos does not change");

        spriteMock.positionX = 40;
        spriteMock.positionY = 0;
        spriteMock.direction = 180;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        assert.equal(spriteMock.direction, 180, "right: direction not changed (180)");


        //top
        spriteMock.positionX = 0;
        spriteMock.positionY = 70;
        spriteMock.direction = 0;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        assert.ok(opReturn == true && lastUpdateEventArgs !== undefined, "simple: top overflow");
        assert.ok(lastUpdateEventArgs.properties.positionY !== undefined && lastUpdateEventArgs.properties.positionX === undefined && lastUpdateEventArgs.id == "spriteId_test", "top overflow: event argument check");
        boundary = is.getLookBoundary("spriteId_test", "i1", 1, 0, false, true);
        var overflowTop = spriteMock.positionY + boundary.top - sh2;
        assert.equal(overflowTop, 0, "simple: top overflow: aligned after bounce");
        assert.equal(spriteMock.direction, 180, "top: direction changed");
        //directions
        spriteMock.positionX = 0;
        spriteMock.positionY = 70;
        spriteMock.direction = -90;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        assert.equal(spriteMock.direction, -90, "top: direction not changed (-90 = sprite direction parallel to handled edge)");
        assert.equal(spriteMock.positionX, 0, "top without direction change: x pos does not change");

        spriteMock.positionX = 0;
        spriteMock.positionY = 70;
        spriteMock.direction = 90;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        assert.equal(spriteMock.direction, 90, "top: direction not changed (90 = sprite direction parallel to handled edge)");

        spriteMock.positionX = 0;
        spriteMock.positionY = 70;
        spriteMock.direction = -20;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        assert.equal(spriteMock.direction, -160, "top: direction changed (-20 -> -160)");

        spriteMock.positionX = 0;
        spriteMock.positionY = 70;
        spriteMock.direction = 40;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        assert.equal(spriteMock.direction, 140, "top: direction changed (40 -> 140)");

        //bottom
        spriteMock.positionX = 0;
        spriteMock.positionY = -70;
        spriteMock.direction = 180;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        assert.ok(opReturn == true && lastUpdateEventArgs !== undefined, "simple: bottom overflow");
        assert.ok(lastUpdateEventArgs.properties.positionY !== undefined && lastUpdateEventArgs.properties.positionX === undefined && lastUpdateEventArgs.id == "spriteId_test", "bottom overflow: event argument check");
        boundary = is.getLookBoundary("spriteId_test", "i1", 1, 0, false, true);
        var overflowBottom = -spriteMock.positionY - boundary.bottom - sh2;
        assert.equal(overflowBottom, 0, "simple: bottom overflow: aligned after bounce");
        assert.equal(spriteMock.direction, 0, "bottom: direction changed");
        //directions
        spriteMock.positionX = 0;
        spriteMock.positionY = -70;
        spriteMock.direction = 90;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        assert.equal(spriteMock.direction, 90, "bottom: direction not changed (90 = sprite direction parallel to handled edge)");
        assert.equal(spriteMock.positionX, 0, "bottom without direction change: x pos does not change");

        spriteMock.positionX = 0;
        spriteMock.positionY = -70;
        spriteMock.direction = -90;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        assert.equal(spriteMock.direction, -90, "bottom: direction not changed (-90 = sprite direction parallel to handled edge)");

        spriteMock.positionX = 0;
        spriteMock.positionY = -70;
        spriteMock.direction = 100;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        assert.equal(spriteMock.direction, 80, "bottom: direction not changed (100 -> 80)");

        spriteMock.positionX = 0;
        spriteMock.positionY = -70;
        spriteMock.direction = -170;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        assert.equal(spriteMock.direction, -10, "bottom: direction not changed (-170 -> -10)");

        //including rotation
        spriteMock.rotationStyle = PocketCode.RotationStyle.ALL_AROUND;
        //left
        lastUpdateEventArgs = undefined;
        spriteMock.positionX = 0;
        spriteMock.positionY = 0;
        spriteMock.direction = 45;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        assert.equal(lastUpdateEventArgs, undefined, "rotation: left but without overflow: no event triggered");

        spriteMock.positionX = -40;
        spriteMock.positionY = 0;
        spriteMock.direction = 45;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        boundary = is.getLookBoundary("spriteId_test", "i1", 1, spriteMock.direction - 90, false, true);
        overflowLeft = -spriteMock.positionX - boundary.left - sw2;
        assert.equal(overflowLeft, 0, "rotation: left overflow: aligned after bounce");

        //right
        lastUpdateEventArgs = undefined;
        spriteMock.positionX = 0;
        spriteMock.positionY = 0;
        spriteMock.direction = 45;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        assert.equal(lastUpdateEventArgs, undefined, "rotation: right but without overflow: no event triggered");

        spriteMock.positionX = 40;
        spriteMock.positionY = 0;
        spriteMock.direction = 45;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        boundary = is.getLookBoundary("spriteId_test", "i1", 1, spriteMock.direction - 90, false, true);
        overflowRight = spriteMock.positionX + boundary.right - sw2;
        assert.equal(overflowRight, 0, "rotation: right overflow: aligned after bounce");

        //top
        lastUpdateEventArgs = undefined;
        spriteMock.positionX = 0;
        spriteMock.positionY = 0;
        spriteMock.direction = 45;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        assert.equal(lastUpdateEventArgs, undefined, "rotation: top but without overflow: no event triggered");

        spriteMock.positionX = 0;
        spriteMock.positionY = 70;
        spriteMock.direction = 45;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        boundary = is.getLookBoundary("spriteId_test", "i1", 1, spriteMock.direction - 90, false, true);
        overflowTop = spriteMock.positionY + boundary.top - sh2;
        assert.equal(overflowTop, 0, "rotation: top overflow: aligned after bounce");

        //bottom
        lastUpdateEventArgs = undefined;
        spriteMock.positionX = 0;
        spriteMock.positionY = 0;
        spriteMock.direction = 45;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        assert.equal(lastUpdateEventArgs, undefined, "rotation: bottom but without overflow: no event triggered");

        spriteMock.positionX = 0;
        spriteMock.positionY = -70;
        spriteMock.direction = 45;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        boundary = is.getLookBoundary("spriteId_test", "i1", 1, spriteMock.direction - 90, false, true);
        overflowBottom = -spriteMock.positionY - boundary.bottom - sh2;
        assert.equal(overflowBottom, 0, "rotation: bottom overflow: aligned after bounce");

        //overflow on two sides without conflicts (look size > viewport size)
        //top right: one edge in direction
        lastUpdateEventArgs = undefined;
        spriteMock.positionX = 40;
        spriteMock.positionY = 70;
        spriteMock.direction = -5;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        boundary = is.getLookBoundary("spriteId_test", "i1", 1, spriteMock.direction - 90, false, true);
        overflowTop = spriteMock.positionY + boundary.top - sh2;
        overflowRight = spriteMock.positionX + boundary.right - sw2;
        assert.ok(overflowTop == 0 && overflowRight == 0, "top/right: 2 sides + rotation: aligned after bounce");
        assert.ok(lastUpdateEventArgs.properties.positionX !== undefined && lastUpdateEventArgs.properties.positionY !== undefined && lastUpdateEventArgs.properties.direction !== undefined, "top/right: 2 sides + rotation: event args check");
        assert.equal(spriteMock.direction, -175, "top/right: direction after bounce");
        //top right: both edges in direction
        lastUpdateEventArgs = undefined;
        spriteMock.positionX = 40;
        spriteMock.positionY = 70;
        spriteMock.direction = 45;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        boundary = is.getLookBoundary("spriteId_test", "i1", 1, spriteMock.direction - 90, false, true);
        overflowTop = spriteMock.positionY + boundary.top - sh2;
        overflowRight = spriteMock.positionX + boundary.right - sw2;
        assert.ok(overflowTop == 0 && overflowRight == 0, "top/right: 2 sides + rotation: aligned after bounce");
        assert.ok(lastUpdateEventArgs.properties.positionX !== undefined && lastUpdateEventArgs.properties.positionY !== undefined && lastUpdateEventArgs.properties.direction !== undefined, "top/right: 2 sides + rotation: event args check");
        assert.equal(spriteMock.direction, -135, "top/right: direction after bounce");


        //top left: one edge in direction
        lastUpdateEventArgs = undefined;
        spriteMock.positionX = -40;
        spriteMock.positionY = 70;
        spriteMock.direction = 15;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        boundary = is.getLookBoundary("spriteId_test", "i1", 1, spriteMock.direction - 90, false, true);
        overflowTop = spriteMock.positionY + boundary.top - sh2;
        overflowLeft = -spriteMock.positionX - boundary.left - sw2;
        assert.ok(overflowTop == 0 && overflowLeft == 0, "top/left: 2 sides + rotation: aligned after bounce");
        assert.ok(lastUpdateEventArgs.properties.positionX !== undefined && lastUpdateEventArgs.properties.positionY !== undefined && lastUpdateEventArgs.properties.direction !== undefined, "top/left: 2 sides + rotation: event args check");
        assert.equal(spriteMock.direction, 165, "top/left: direction after bounce");
        //top left: both edges in direction
        lastUpdateEventArgs = undefined;
        spriteMock.positionX = -40;
        spriteMock.positionY = 70;
        spriteMock.direction = -5;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        boundary = is.getLookBoundary("spriteId_test", "i1", 1, spriteMock.direction - 90, false, true);
        overflowTop = spriteMock.positionY + boundary.top - sh2;
        overflowLeft = -spriteMock.positionX - boundary.left - sw2;
        assert.ok(overflowTop == 0 && overflowLeft == 0, "top/left: 2 sides + rotation: aligned after bounce");
        assert.ok(lastUpdateEventArgs.properties.positionX !== undefined && lastUpdateEventArgs.properties.positionY !== undefined && lastUpdateEventArgs.properties.direction !== undefined, "top/left: 2 sides + rotation: event args check");
        assert.equal(spriteMock.direction, 175, "top/left: direction after bounce");

        //bottom right: one edge in direction
        lastUpdateEventArgs = undefined;
        spriteMock.positionX = 40;
        spriteMock.positionY = -70;
        spriteMock.direction = 5;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        boundary = is.getLookBoundary("spriteId_test", "i1", 1, spriteMock.direction - 90, false, true);
        overflowBottom = -spriteMock.positionY - boundary.bottom - sh2;
        overflowRight = spriteMock.positionX + boundary.right - sw2;
        assert.ok(overflowBottom == 0 && overflowRight == 0, "bottom/right: 2 sides + rotation: aligned after bounce");
        assert.ok(lastUpdateEventArgs.properties.positionX !== undefined && lastUpdateEventArgs.properties.positionY !== undefined && lastUpdateEventArgs.properties.direction !== undefined, "bottom/right: 2 sides + rotation: event args check");
        assert.equal(spriteMock.direction, -5, "bottom/right: direction after bounce");
        //bottom right: both edges in direction
        lastUpdateEventArgs = undefined;
        spriteMock.positionX = 40;
        spriteMock.positionY = -70;
        spriteMock.direction = 105;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        boundary = is.getLookBoundary("spriteId_test", "i1", 1, spriteMock.direction - 90, false, true);
        overflowBottom = -spriteMock.positionY - boundary.bottom - sh2;
        overflowRight = spriteMock.positionX + boundary.right - sw2;
        assert.ok(overflowBottom == 0 && overflowRight == 0, "bottom/right: 2 sides + rotation: aligned after bounce");
        assert.ok(lastUpdateEventArgs.properties.positionX !== undefined && lastUpdateEventArgs.properties.positionY !== undefined && lastUpdateEventArgs.properties.direction !== undefined, "bottom/right: 2 sides + rotation: event args check");
        assert.equal(spriteMock.direction, -75, "bottom/right: direction after bounce");

        //bottom left
        lastUpdateEventArgs = undefined;
        spriteMock.positionX = -40;
        spriteMock.positionY = -70;
        spriteMock.direction = -95;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        boundary = is.getLookBoundary("spriteId_test", "i1", 1, spriteMock.direction - 90, false, true);
        overflowBottom = -spriteMock.positionY - boundary.bottom - sh2;
        overflowLeft = -spriteMock.positionX - boundary.left - sw2;
        assert.ok(overflowBottom == 0 && overflowLeft == 0, "bottom/left: 2 sides + rotation: aligned after bounce");
        assert.ok(lastUpdateEventArgs.properties.positionX !== undefined && lastUpdateEventArgs.properties.positionY !== undefined && lastUpdateEventArgs.properties.direction !== undefined, "bottom/left: 2 sides + rotation: event args check");
        assert.equal(spriteMock.direction, 85, "bottom/left: direction after bounce");

        //flipX
        spriteMock.rotationStyle = PocketCode.RotationStyle.LEFT_TO_RIGHT;
        lastUpdateEventArgs = undefined;
        spriteMock.positionX = 40;
        spriteMock.positionY = -70;
        spriteMock.direction = 105;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        boundary = is.getLookBoundary("spriteId_test", "i1", 1, 0, true, true);
        overflowBottom = -spriteMock.positionY - boundary.bottom - sh2;
        overflowRight = spriteMock.positionX + boundary.right - sw2;
        assert.ok(overflowBottom == 0 && overflowRight == 0, "flipX: bottom/right: 2 sides + rotation: aligned after bounce");
        assert.ok(lastUpdateEventArgs.properties.positionX !== undefined && lastUpdateEventArgs.properties.positionY !== undefined && lastUpdateEventArgs.properties.direction !== undefined, "flipX: bottom/right: 2 sides + rotation: event args check");
        assert.equal(spriteMock.direction, -75, "flipX: bottom/right: direction after bounce");


        complexTests();
        done1();
    };

    var complexTests = function () {
        //complex cases: overflow on opposite edges (before/after rotate)

        spriteMock.currentLook = {
            imageId: "i9",
        };
        spriteMock.rotationStyle = PocketCode.RotationStyle.ALL_AROUND;

        //overflow on all sides: the sprite should bounce from the top/right corner(direction = 90)
        lastUpdateEventArgs = undefined;
        spriteMock.positionX = 0;
        spriteMock.positionY = 0;
        spriteMock.direction = 90;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        boundary = is.getLookBoundary("spriteId_test", "i9", 1, spriteMock.direction - 90, false, true);
        var overflowTop = spriteMock.positionY + boundary.top - sh2;
        var overflowRight = spriteMock.positionX + boundary.right - sw2;
        assert.ok(overflowTop == 0 && overflowRight == 0, "complex: bounce from top/right");

        //overflow on all sides: the sprite should bounce from the bottom/right corner (direction = 100)
        lastUpdateEventArgs = undefined;
        spriteMock.positionX = 0;
        spriteMock.positionY = 0;
        spriteMock.direction = 100;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        boundary = is.getLookBoundary("spriteId_test", "i9", 1, spriteMock.direction - 90, false, true);
        var overflowBottom = -spriteMock.positionY - boundary.bottom - sh2;
        overflowRight = spriteMock.positionX + boundary.right - sw2;
        assert.ok(overflowBottom == 0 && overflowRight == 0, "complex: bounce from bottom/right");

        //overflow on all sides: the sprite should bounce from the top/left corner(direction = -90)
        lastUpdateEventArgs = undefined;
        spriteMock.positionX = 0;
        spriteMock.positionY = 0;
        spriteMock.direction = -90;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        boundary = is.getLookBoundary("spriteId_test", "i9", 1, spriteMock.direction - 90, false, true);
        overflowTop = spriteMock.positionY + boundary.top - sh2;
        var overflowLeft = -spriteMock.positionX - boundary.left - sw2;
        assert.ok(overflowTop == 0 && overflowLeft == 0, "complex: bounce from top/left");

        //overflow on all sides: the sprite should bounce from the bottom/left corner (direction = -100)
        lastUpdateEventArgs = undefined;
        spriteMock.positionX = 0;
        spriteMock.positionY = 0;
        spriteMock.direction = -100;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        boundary = is.getLookBoundary("spriteId_test", "i9", 1, spriteMock.direction - 90, false, true);
        overflowBottom = -spriteMock.positionY - boundary.bottom - sh2;
        overflowLeft = -spriteMock.positionX - boundary.left - sw2;
        assert.ok(overflowBottom == 0 && overflowLeft == 0, "complex: bounce from bottom/left");

        //overflow on three sides
        spriteMock.currentLook = {
            imageId: "i10",
        };
        lastUpdateEventArgs = undefined;
        spriteMock.positionX = 0;
        spriteMock.positionY = 100;
        spriteMock.direction = 0;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        boundary = is.getLookBoundary("spriteId_test", "i10", 1, spriteMock.direction - 90, false, true);
        overflowTop = spriteMock.positionY + boundary.top - sh2;
        overflowRight = spriteMock.positionX + boundary.right - sw2;
        assert.ok(overflowTop == 0 && overflowRight == 0, "complex (3 sides): bounce from top/right");

        lastUpdateEventArgs = undefined;
        spriteMock.positionX = 0;
        spriteMock.positionY = -100;
        spriteMock.direction = 0;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        boundary = is.getLookBoundary("spriteId_test", "i10", 1, spriteMock.direction - 90, false, true);
        overflowBottom = -spriteMock.positionY - boundary.bottom - sh2;
        overflowRight = spriteMock.positionX + boundary.right - sw2;
        assert.ok(overflowBottom == 0 && overflowRight == 0, "complex (3 sides): bounce from bottom/right");

        //take care of overflows that occur during bounce
        spriteMock.positionX = -100;
        spriteMock.positionY = 0;
        spriteMock.direction = -105;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        boundary = is.getLookBoundary("spriteId_test", "i10", 1, spriteMock.direction - 90, false, true);
        overflowLeft = -spriteMock.positionX - boundary.left - sw2;
        assert.ok(overflowLeft == 0, "complex (overflow during bounce): left");

        //test on top/bottom: landscape
        ga._originalScreenHeight = 50;
        ga._originalScreenWidth = 100;
        sh2 = ga._originalScreenHeight / 2,
        sw2 = ga._originalScreenWidth / 2;
        //spriteMock.size = 200;

        spriteMock.positionX = 100;
        spriteMock.positionY = 0;
        spriteMock.direction = 80;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        boundary = is.getLookBoundary("spriteId_test", "i10", 1, spriteMock.direction - 90, false, true);
        overflowTop = spriteMock.positionY + boundary.top - sh2;
        overflowRight = spriteMock.positionX + boundary.right - sw2;
        //overflowLeft = -spriteMock.positionX - boundary.left - sw2;
        assert.ok(overflowTop == 0 && overflowRight == 0, "complex: overflow during bounce (after rotate) from top/bottom");

        //imagge11: diagonal
        spriteMock.currentLook = {
            imageId: "i11",
        };
        ga._originalScreenHeight = 50;
        ga._originalScreenWidth = 50;
        sh2 = ga._originalScreenHeight / 2,
        sw2 = ga._originalScreenWidth / 2;
        //top
        spriteMock.positionX = 0;
        spriteMock.positionY = 40;
        spriteMock.direction = 45;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        boundary = is.getLookBoundary("spriteId_test", "i11", 1, spriteMock.direction - 90, false, true);
        overflowTop = spriteMock.positionY + boundary.top - sh2;
        overflowRight = spriteMock.positionX + boundary.right - sw2;
        assert.ok(overflowTop == 0 && overflowRight == 0, "complex: overflow during bounce (after rotate) from left/right: 45");
        //bottom
        spriteMock.positionX = 0;
        spriteMock.positionY = -40;
        spriteMock.direction = -135;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        boundary = is.getLookBoundary("spriteId_test", "i11", 1, spriteMock.direction - 90, false, true);
        overflowBottom = -spriteMock.positionY - boundary.bottom - sh2;
        overflowLeft = -spriteMock.positionX - boundary.left - sw2;
        assert.ok(overflowBottom == 0 && overflowLeft == 0, "complex: overflow during bounce (after rotate) from left/right: -135");
        //right
        spriteMock.positionX = 40;
        spriteMock.positionY = 0;
        spriteMock.direction = 135;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        boundary = is.getLookBoundary("spriteId_test", "i11", 1, spriteMock.direction - 90, false, true);
        overflowBottom = -spriteMock.positionY - boundary.bottom - sh2;
        //overflowTop = spriteMock.positionY + boundary.top - sh2;
        overflowRight = spriteMock.positionX + boundary.right - sw2;
        //overflowLeft = -spriteMock.positionX - boundary.left - sw2;
        assert.ok(overflowBottom == 0 && overflowRight == 0, "complex: overflow during bounce (after rotate) from top/bottom: 135");
        //left
        spriteMock.positionX = -40;
        spriteMock.positionY = 0;
        spriteMock.direction = -45;
        opReturn = ga.ifSpriteOnEdgeBounce(spriteMock);
        boundary = is.getLookBoundary("spriteId_test", "i11", 1, spriteMock.direction - 90, false, true);
        //overflowBottom = -spriteMock.positionY - boundary.bottom - sh2;
        overflowTop = spriteMock.positionY + boundary.top - sh2;
        overflowLeft = -spriteMock.positionX - boundary.left - sw2;
        assert.ok(overflowTop == 0 && overflowLeft == 0, "complex: overflow during bounce (after rotate) from top/bottom: -135");

        done2();
    };

});

