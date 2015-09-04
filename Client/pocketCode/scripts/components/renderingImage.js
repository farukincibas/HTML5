﻿/// <reference path="../components/sprite.js" />

PocketCode.RenderingImage = (function () {

    function RenderingImage(imageProperties) {
        this.type = 'sprite';
        this._fabricImage = fabric.util.createClass(fabric.Image, {
            //type: 'sprite',

            initialize: function (element, options) {
                options || (options = {});

                this.callSuper('initialize', element, options);

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
                    positionX: options.x,
                    positionY: options.y,
                    //flipX = flipH: false, //already a property and false (default)
                    //flipy = flipV: false, //already a property and false (default)
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

        if (!imageProperties || !(typeof imageProperties === 'object'))
            throw new Error('The rendering object has to be initialized using a sprite parameter object');

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
                //return this._fabricImage;
            },
        },
        positionX: {
            set: function (value) {
                //return this._fabricImage;
            },
        },
        positionY: {
            set: function (value) {
                //return this._fabricImage;
            },
        },
        direction: {
            set: function (value) {
                //return this._fabricImage;
            },
        },
        rotationStyle: {
            set: function (value) {
                //return this._fabricImage;
            },
        },
        look: {
            set: function (value) {
                //return this._fabricImage;
            },
        },
        size: {
            set: function (value) {
                //return this._fabricImage;
            },
        },
        visible: {
            set: function (value) {
                //return this._fabricImage;
            },
        },
        transparency: {
            set: function (value) {
                //return this._fabricImage;
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