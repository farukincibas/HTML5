﻿/// <reference path="../core.js" />
'use strict';


/**
 * @namespace CV
 * @type {{}|*}
 */

PocketCode.RenderingItem = fabric.util.createClass(fabric.Image, {
        type: 'sprite',

        initialize: function(element, options) {
            options || (options = { });

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
                originY: "center"
            });

            this.setAngle(options.angle);
            this.setOpacity(options.opacity);
        },

        toObject: function() {
            return fabric.util.object.extend(this.callSuper('toObject'), {
                id: this.get('id'),
                name: this.get('name')
            });
        },

        _render: function(ctx) {
            this.callSuper('_render', ctx);
        },

        setAngle: function(direction){
            this.angle = direction - 90;
        },

        setOpacity: function(transparency){
            this.opacity = +(1 - transparency / 100).toFixed(2);
        },

        applyBrightness: function(brightness){
            var bright = +((255/100)*(brightness - 100)).toFixed(0);
            var brightnessFilter = new fabric.Image.filters.Brightness({brightness: bright});

            var overwriteFilter = false;
            for (var i = 0; i < this.filters.length; i++){
                if (this.filters[i].type == "Brightness"){
                    this.filters[i] = brightnessFilter;
                    overwriteFilter = true;
                }
            }

            if (!overwriteFilter)
                this.filters.push(brightnessFilter);

            var replacement = fabric.util.createImage();
            var imgEl = this._originalElement;
            var canvasEl = fabric.util.createCanvasElement();
            var  _this = this;

            canvasEl.width = imgEl.width;
            canvasEl.height = imgEl.height;
            canvasEl.getContext('2d').drawImage(imgEl, 0, 0, imgEl.width, imgEl.height);


            brightnessFilter.applyTo(canvasEl);

            replacement.width = canvasEl.width;
            replacement.height = canvasEl.height;

            _this._element = replacement;
            _this._filteredEl = replacement;
            replacement.src = canvasEl.toDataURL('image/png');

        }

    });
