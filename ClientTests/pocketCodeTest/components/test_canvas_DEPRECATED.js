/// <reference path="../../qunit/qunit-1.18.0.js" />
/// <reference path="../../../Client/pocketCode/scripts/components/canvas.js" />
'use strict';


QUnit.module("playerViewportController.js");

QUnit.test("PlayerViewportController", function (assert) {

	var done = assert.async();  //async tests: due to image loading delay

	var sprite2test = null;
	var dom = document.getElementById("qunit-fixture");

	//var el = document.createElement("canvas");
	//dom.appendChild(el);

	//el.width = 600; el.height = 600;
	var gme = new PocketCode.GameEngine();
	var controller = new PocketCode.CanvasController(gme);
	dom.appendChild(controller.view._dom);

	var imageOnLoad_runTests = function () {

		// assert.ok(controller.zoomfactor == 0.5, "get zoomfactor"); TODO: zf needed?
		assert.ok(controller.view.fabricCanvas instanceof fabric.Canvas, "Canvas type correct");

		//create 5 sprites
		var sprites = [];
		gme._sprites = sprites;
		for (var i = 0; i < 5; i++)
		{
			//controller.addSprite(populateSprites(i, 'tree', i, 50 * i, 50 * i, 20, looks, true, i * 60, 0, 90));
		    sprites.push(populateSprite(gme, i, 'tree', i, 50 * i, 50 * i, 20, looks, true, i * 60, 0, 90));
		}
		var spritex = sprites[3];

		// initialize controller
		controller.init(sprites);

		assert.ok(controller.initialized == true, "Controller initialized");
		assert.ok(controller.view.renderingObjects == controller.renderingItems, "rendering lists equal");

		// check if items are passed correctly
		assert.ok(controller.view.renderingObjects.length == 5, "rendering item array count");
		assert.ok(controller.view.fabricCanvas.getObjects().length == 5, "rendering item count on canvas");

		spritex.setPosition(20, 45, true);
		var sx_canvas = controller._getSpriteOnCanvas(spritex.id);
		assert.ok(sx_canvas.positionX == spritex.positionX, "x position set");
		assert.ok(sx_canvas.positionY == spritex.positionY, "y position set");
		// TODO test layer change

		assert.throws(function() {controller.renderingItems = 2;}, SmartJs.Error.InvalidArgumentException,'set rendering items to non-array type');

		var res = controller._getSpriteOnCanvas(100);
		assert.ok(res == undefined, 'get item not on canvas');

		spritex.comeToFront();
		assert.ok(gme._sprites.indexOf(spritex) == controller.renderingItems.indexOf(controller._getSpriteOnCanvas(spritex.id)), "index is equal (front)");

		spritex.goBack();
		assert.ok(gme._sprites.indexOf(spritex) == controller.renderingItems.indexOf(controller._getSpriteOnCanvas(spritex.id)), "index is equal (back)");

		var str = controller.downloadCanvas(1);
		assert.ok(controller.view.fabricCanvas.toDataURL({multiplier:1}) == str, "download of canvas correct");


		controller.clearCanvas();
		assert.ok(controller.renderingItems.length == 0, "cleared canvas");

		done();
		//insert new element with id 5 (sixth element) at layer 2
		//controller.addSprite(populateSprite(gme,5, 'tree', 2, 200, 400, 100, looks, true, 100, 0, 90));
/*
		var sprites = controller.view.fabricCanvas.getObjects();
		// TODO  insertAt assert.ok(sprites.indexOf(controller._getSpriteOnCanvas(5)) == 2 && sprites.indexOf(controller._getSpriteOnCanvas(3)) == 4 && sprites.indexOf(controller._getSpriteOnCanvas(2)) == 3 && sprites.indexOf(controller._getSpriteOnCanvas(1)) == 1 && controller._canvas.getObjects().length == 6, "insert sprite at layer in use (move other sprites one layer to front)");

		// move sprite with id 5 to position 300, 400
		controller.renderSpriteChange({ id: 5, changes: [{ property: '_positionX', value: 300 }, { property: '_positionY', value: 400 }] });
		sprite2test = controller._getSpriteOnCanvas(5);
		assert.ok(sprite2test.top == 300 && sprite2test.left == 400, "move sprite to specified position");

		// change layer of sprite
		controller.renderSpriteChange({ id: 5, changes: [{ property: '_layer', value: 0 }] });
		sprite2test = controller._getSpriteOnCanvas(5);
		// TODO change Layer assert.ok(sprites.indexOf(sprite2test) == 0 && sprites.indexOf(controller._getSpriteOnCanvas(0)) == 1 && sprites.indexOf(controller._getSpriteOnCanvas(3)) == 4, "change layer of sprite");

		// change direction of sprite
		controller.renderSpriteChange({ id: 5, changes: [{ property: '_direction', value: 180 }] });
		sprite2test = controller._getSpriteOnCanvas(5);
		assert.ok(sprite2test.angle == 90, "change direction of sprite by 180 (should be actual direction of 90 on canvas)");

		// change transparency of sprite
		controller.renderSpriteChange({ id: 5, changes: [{ property: '_transparency', value: 80 }] });
		sprite2test = controller._getSpriteOnCanvas(5);
		assert.ok(sprite2test.opacity == 0.2, "change transparency of sprite by 80 % (should be 20% opacity on canvas)");

		// change visibility of sprite
		controller.renderSpriteChange({ id: 5, changes: [{ property: '_visible', value: false }] });
		sprite2test = controller._getSpriteOnCanvas(5);
		assert.ok(sprite2test.visible == false, "change visibility of sprite");

		// change brightness of sprite to max brightness
		controller.renderSpriteChange({ id: 5, changes: [{ property: '_brightness', value: 200 }] });
		sprite2test = controller._getSpriteOnCanvas(5);
		assert.ok(sprite2test.filters[0].brightness == 255, "change brightness to max (200) (should be 255 on canvas)");

		// change brightness of sprite to min brightness
		controller.renderSpriteChange({ id: 5, changes: [{ property: '_brightness', value: 0 }] });
		sprite2test = controller._getSpriteOnCanvas(5);
		assert.ok(sprite2test.filters[0].brightness == -255, "change brightness to min (0) (should be -255 on canvas)");

		// change brightness of sprite to normal brightness (default value)
		controller.renderSpriteChange({ id: 5, changes: [{ property: '_brightness', value: 100 }] });
		sprite2test = controller._getSpriteOnCanvas(5);
		assert.ok(sprite2test.filters[0].brightness == 0, "change brightness to default value (100) (should be 0 on canvas)");

		// change brightness of sprite to 50% brightness
		controller.renderSpriteChange({ id: 5, changes: [{ property: '_brightness', value: 50 }] });
		sprite2test = controller._getSpriteOnCanvas(5);
		assert.ok(sprite2test.filters[0].brightness == -127, "change brightness to 50% (should be 127 on canvas)");

		//TODO test Axes + click 

		done(); //async tests completed
*/
	};

	var currentLook = new Image();
	var looks = [];
	looks[0] = currentLook;
	currentLook.addEventListener("load", imageOnLoad_runTests);  //added handler to run tests when image completed loading
	currentLook.src = "_resources/images/tree-transparent.png";


});


function populateSprite(ge,id, name, layer, x, y, scale, imgElement, visible, bright, transp, angle) {
	var sprite = new PocketCode.Model.Sprite(ge,{ id: "newId", name: "myName" });

	sprite.id = id;
	sprite.name = name;
	// sprite.layer = layer;
	sprite.setPositionX(x);
	sprite.setPositionY(y);
	sprite.setSize(scale);
	sprite.looks = imgElement;
	sprite.setGraphicEffect(PocketCode.GraphicEffect.GHOST, transp);
	sprite.setGraphicEffect(PocketCode.GraphicEffect.BRIGHTNESS, bright);
	sprite.setDirection(angle);
	if (visible)
		sprite.show();
	else
		sprite.hide();

	return sprite;

}

// ----------------------------------------- OLD CODE --------------------------------------------------



/*function updateSprite() {
	var sprite2test = null;

	var canvas = new PocketCode.Canvas("pcCanvas", 0.5);
	var currentLook = new Image();
	currentLook.src = "_resources/images/tree-transparent.png";
	var looks = [];
	looks[0] = currentLook;

	//create 5 sprites
	for (var i = 0; i < 5; i++) {
		canvas.addSprite(populateSprite(i, 'tree', i, 50 * i, 50 * i, 20, looks, true, i * 60, 0, 90));
	}

	var currentLook2 = new Image();
	currentLook2.src = "_resources/images/minion.jpg";

	var looks2 = [];
	looks2[0] = currentLook2;
	canvas.addSprite(populateSprite(5, 'tree', 5, 200, 400, 100, looks2, true, 100, 0, 90));
	canvas.render();

	//insert element with id 6 (eleventh element) at layer 3 
	canvas.addSprite(populateSprite(6, 'tree', 3, 15, 15, 20, looks, true, 0, 0, 90));
	canvas.render();

	// move sprite with id 5 to position 300, 400
	canvas.renderSpriteChange({ id: 5, changes: [{ property: '_positionX', value: 300 }, { property: '_positionY', value: 400 }] });

	//	 change layer of sprite
	// canvas.renderSpriteChange({ id: 5, changes: [{ property: '_layer', value: 0 }] });

	// change direction of sprite
	canvas.renderSpriteChange({ id: 5, changes: [{ property: '_direction', value: 180 }] });

	// change transparency of sprite
	canvas.renderSpriteChange({ id: 5, changes: [{ property: '_transparency', value: 80 }] });

	//	// change visibility of sprite
	//	canvas.renderSpriteChange({id: 5, changes:[{property: '_visible', value: false}]});
	//	sprite2testOnCanvas = canvas.getSpriteOnCanvas(5);
	//	sprite2test = canvas.getSpriteById(5);

	canvas.showAxes = true;

	//	canvas.showAxes = false;
}*/