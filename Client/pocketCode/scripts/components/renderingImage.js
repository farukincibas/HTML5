﻿/// <reference path="../components/sprite.js" />

PocketCode.RenderingImage = (function () {

    function RenderingImage(imageProperties) {
        this.type = 'sprite';
        this._fabricImage = new PocketCode.FImage(imageProperties.look);
        if (!imageProperties || !(typeof imageProperties === 'object'))
            throw new Error('The rendering object has to be initialized using a sprite parameter object');

        this._length = imageProperties.look.center.length;
        this._angle = imageProperties.look.center.angle;
        this._initialScaling = imageProperties.look.initialScaling;

        this.merge(imageProperties);
    }

    //properties
    Object.defineProperties(RenderingImage.prototype, {
        object: {
            get: function () {
                return this._fabricImage;
            },
        },
        id: {
            set: function (value) {
                this._fabricImage.id = value;
            },
        },
        positionX: {
            set: function (value) {
                this._positionX = value + this._length  * Math.cos(this._angle);
            },
        },
        positionY: {
            set: function (value) {
                this._positionY = value + this._length * Math.sin(this._angle);
            },
        },
        direction: {
            set: function (value) {
                console.log('CHANGE DIR',value);
                this._fabricImage.angle = value - 90;
            },
        },
        rotationStyle: {
            set: function (value) {
                // TODO check direction? if on edge bounce?
                // this._fabricImage.flipX = PocketCode.RotationStyle.LEFT_TO_RIGHT === value;
            },
        },
        look: {
            set: function (value) {
                console.log('CHANGELOOK' ,value);
                this._fabricImage.setElement(value.canvas);
            },
        },
        size: {
            set: function (value) {
                // TODO apply to with, height?
                this._size = value / 100.;
                //this._fabricImage.scaleX = value / 100.;
                //this._fabricImage.scaleY = value / 100.;
            },
        },
        visible: {
            set: function (value) {
                this._fabricImage.visible = value;
            },
        },
        transparency: {
            set: function (value) {
                //todo opacity 250 to 100 convert apply filter in contructor
                // this._fabricImage.opacity = (100 - value) / 100.;
            },
        },
        brightness: {
            set: function (value) {
                //return this._fabricImage;
            },
        },
    });

    //methods
    RenderingImage.prototype.merge({
        //setAngle: function (direction) {
        //    this.angle = direction - 90;
        //},
        //setOpacity: function (transparency) {
        //    this.opacity = +(1 - transparency / 100).toFixed(2);
        //},
        //applyBrightness: function (brightness) {
        //    var bright = +((255 / 100) * (brightness - 100)).toFixed(0);
        //    var brightnessFilter = new fabric.Image.filters.Brightness({ brightness: bright });

        //    var overwriteFilter = false;
        //    for (var i = 0; i < this.filters.length; i++) {
        //        if (this.filters[i].type == "Brightness") {
        //            this.filters[i] = brightnessFilter;
        //            overwriteFilter = true;
        //        }
        //    }

        //    if (!overwriteFilter)
        //        this.filters.push(brightnessFilter);

        //    var replacement = fabric.util.createImage();
        //    var imgEl = this._originalElement;
        //    var canvasEl = fabric.util.createCanvasElement();
        //    var _this = this;

        //    canvasEl.width = imgEl.width;
        //    canvasEl.height = imgEl.height;
        //    canvasEl.getContext('2d').drawImage(imgEl, 0, 0, imgEl.width, imgEl.height);


        //    brightnessFilter.applyTo(canvasEl);

        //    replacement.width = canvasEl.width;
        //    replacement.height = canvasEl.height;

        //    _this._element = replacement;
        //    _this._filteredEl = replacement;
        //    replacement.src = canvasEl.toDataURL('image/png');
        //}
    });

    return RenderingImage;
})();

PocketCode.FImage = fabric.util.createClass(fabric.Image, {
    //type: 'sprite',

    initialize: function (element, options) {
        if (!element)
            return;
        options || (options = {});
        console.log("element",element);
        this.callSuper('initialize', element.canvas, options);

        this.set({
            id: options.id,
            name: options.name,
            perPixelTargetFind: true, // only pixels inside item area trigger click
            selectable: false,
            hasControls: false,
            hasBorders: false,
            hasRotatingPoint: false,
            originX: "center",
            originY: "center",
            width: element.canvas.width,
            height: element.canvas.height,
            // flipX = flipH: false, //already a property and false (default)
            // flipy = flipV: false, //already a property and false (default)
            filters: [],
            opacity: 1.0
        });

        this.setAngle(options.angle);
        this.setOpacity(options.opacity);
    },

    toObject: function () {
        return fabric.util.object.extend(this.callSuper('toObject'), {
            id: this.get('id'),
            name: this.get('name')
        });
    },

    _render: function (ctx) {
        this.callSuper('_render', ctx);
    },
});