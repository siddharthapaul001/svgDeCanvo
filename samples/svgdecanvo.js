/**
 * SvgDeCanvo 1.0.1 - JavaScript Vector Library
 * Copyright (c) 2015-2018 InfoSoft Global Pvt. Ltd. <http://www.fusioncharts.com>
 * Licensed under the MIT license.
 */
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.SvgDeCanvo = factory());
}(this, (function () { 'use strict';

  var win = typeof window !== 'undefined' ? window : null,
    doc = win.document,
    drawLib = {},
    utilLib = {},
    SvgDeCanvo;

  /**
   * The Constructor function
   * @constructor
   * @param {string/SVG DOM Object} - SVG element to be draw on canvas
   * @param {function} - The function to be called after successsfully drawing in canvas
   */
  SvgDeCanvo = function (svgElem, canvasElem, x, y, width, height, callback) {
    var BLANK = '',
      store = {
        svg: BLANK,
        context: BLANK,
        callBack: BLANK,
        imageArr: [],
        canvas: BLANK,
        dimention: {}
      };

    // Check if call as class or function
    if (!(this instanceof SvgDeCanvo)) {
      throw new Error('This function should be used as class');
    }

    this._getStore = function (param) {
      if (typeof store[param] !== 'undefined') {
        return store[param];
      } else {
        return false;
      }
    };

    this._setStore = function (param, value) {
      if (typeof store[param] !== 'undefined') {
        store[param] = value;
      }
    };
    this._setStore('dimention', {
      x: x,
      y: y,
      width: width,
      height: height
    });
    if (svgElem) {
      this.setSVG(svgElem);
    }
    if (canvasElem) {
      this.setContext(canvasElem);
    }
    if (callback) {
      this.setCallback(callback);
    }
    this.drawOnCanvas();
  };

  // Setter function for the context element
  SvgDeCanvo.prototype.setContext = function (canvasElem) {
    var context;
    if (canvasElem.getContext && canvasElem.getContext('2d')) {
      // Assigning the 2d context
      context = canvasElem.getContext('2d');
      this._setStore('canvas', canvasElem);
      this._setStore('context', context);
    } else {
      // if canvas is not supported
      throw new Error('Please provide valid canvas');
    }
  };

  // Getter function for the context object
  SvgDeCanvo.prototype.getContext = function () {
    return this._getStore('context');
  };

  // Setter function for the SVG element
  SvgDeCanvo.prototype.setSVG = function (svgElem) {
    var svg;
    // Create the svg document object also if string is passed
    if (typeof svgElem.documentElement !== 'undefined') {
      svg = svgElem;
      this._setStore('svg', svg);
    } else if (svgElem.substr(0, 1) === '<') {
      svg = utilLib.StrToDom(svgElem);
      this._setStore('svg', svg);
    } else {
      throw new Error('Please provide valid SVG');
    }
  };

  // Getter function for SVG element
  SvgDeCanvo.prototype.getSVG = function () {
    return this._getStore('svg');
  };

  SvgDeCanvo.prototype.setCallback = function (callback) {
    if (typeof callback === 'function') {
      this._setStore('callBack', callback);
    }
  };

  SvgDeCanvo.prototype.getCallback = function () {
    return this._getStore('callBack');
  };

  /**
   * Method that draw the element in the dom tree in order
   * this is also recursive and will draw only the innermost
   * Element of a node.
   * @param {array} arr - the dom array
   */
  SvgDeCanvo.prototype.drawOnCanvas = function (svgElem, canvasElem, x, y, width, height, callback) {
    var context, svg, oriWidth, oriHeight, scaleX, scaleY, dimention, oriDimention;

    if (svgElem) {
      this.setSVG(svgElem);
    }
    if (canvasElem) {
      this.setContext(canvasElem);
    }
    if (callback) {
      this.setCallback(callback);
    }
    canvasElem = canvasElem || this._getStore('canvas');
    dimention = this._getStore('dimention');

    callback = this.getCallback();
    context = this.getContext();
    svg = this.getSVG();
    if (!svg || !context) {
      return;
    }
    oriDimention = utilLib.getSvgDimention(svg);
    oriWidth = oriDimention.width;
    oriHeight = oriDimention.height;
    x = x || dimention.x || 0;
    y = y || dimention.y || 0;
    width = width || dimention.width || oriWidth;
    height = height || dimention.height || oriHeight;
    scaleX = oriDimention.width ? width / oriWidth : 1;
    scaleY = oriDimention.height ? height / oriHeight : 1;
    utilLib.startTransform(
      'translate(' + x + ',' + y + ') scale(' + scaleX + ',' + scaleY + ')',
      context
    );
    context.save();
    context.fillStyle = '#ffffff';
    // Clearing the canvas for fresh rendering
    context.fillRect(0, 0, width, height);
    context.restore();
    utilLib.storeImagesInArr(this);
    utilLib.drawNodes([svg], [], this, context, function () {
      typeof callback === 'function' && callback();
      utilLib.resetTransform(context);
    });
  };

  /** ************************ Draw Methods start *******************************
   * Below are the functions that will be used for drawing the relative SVG    *
   * elements on canvas                                                        *
   * function name should be like draw{tagName} for ex - for text element      *
   * name will be drawtext.                                                    *
   * the function will get one argument the respective SVG with all Attributes *
   * required to draw it perfectly                                             *
   *****************************************************************************/
  drawLib.common = function (node, attrib, svgDeCanvo, context, callBack) {
    var children = node.childNodes,
      fnName,
      i,
      styleArr,
      styleName,
      callBackFn = function () {
        // restore if any required
        if (node.attributes) {
          context.restore();
        }
        // cal the parent callback
        callBack && callBack();
      };
    // do node specific work

    for (i in attrib) {
      if (!attrib.hasOwnProperty(i)) {
        continue;
      }
      // Dont copy this parent attribute
      if (attrib[i].name === 'class' || attrib[i].name === 'id') {
        continue;
      }
      if (attrib[i].name === 'transform' || attrib[i].name === 'clip-path') {
        continue;
      }
      // If attribute not exist copy parent attribute
      if (typeof attrib[i] === 'object' && node.attributes && !node.attributes[attrib[i].name]) {
        node.setAttribute([attrib[i].name], attrib[i].value);
      }
    }
    // Include style attribute that are not present in the attribute list
    if (node.attributes && node.attributes.style) {
      styleArr = node.attributes.style.value.replace(/;$/, '').split(';');
      for (i in styleArr) {
        if (!styleArr.hasOwnProperty(i)) {
          continue;
        }
        styleName = styleArr[i].split(':')[0].trim();
        if (!node.attributes[styleName] || node.attributes[styleName].value === 'undefined') {
          // bypass the style element starting with -webkit
          try {
            node.setAttribute(styleName, styleArr[i].split(':')[1].trim());
          } catch (e) {}
        }
      }
    }
    if (node.attributes) {
      context.save();
      if (node.attributes.transform) {
        utilLib.startTransform(node.attributes.transform.value, context);
      }
      if (node.attributes['clip-path']) {
        utilLib.applyClip(node.attributes['clip-path'].value, context, svgDeCanvo);
      }
    }
    if (children.length === 0 || (children.length === 1 && !children[0].tagName)) {
      if (typeof node.tagName !== 'undefined') {
        fnName = 'draw' + node.tagName;
        if (drawLib[fnName]) {
          if (node.attributes.display && node.attributes.display.value === 'none') {
            callBackFn();
          } else {
            drawLib[fnName](node, context, svgDeCanvo, 'draw', callBackFn);
          }
        } else {
          callBackFn();
        }
      } else {
        callBackFn();
      }
    } else {
      utilLib.drawNodes(
        children,
        node.tagName === 'svg' ? [] : node.attributes,
        svgDeCanvo,
        context,
        callBackFn
      );
    }
  };

  drawLib.drawtext = function (elem, context, svgDeCanvo, pps, callBackFn) {
    // Internally calling the drawspan function
    this.drawtspan(elem, context, svgDeCanvo, pps, callBackFn);
  };

  drawLib.drawtspan = function (elem, context, svgDeCanvo, pps, callBackFn) {
    // innerHTML for chrome and firefox textContent for safari and IE
    var text = elem.innerHTML || elem.textContent,
      x = elem.attributes.x ? elem.attributes.x.value : 0,
      y = elem.attributes.y ? elem.attributes.y.value : 0,
      dx = elem.attributes.dx ? elem.attributes.dx.value : 0,
      dy = elem.attributes.dy ? elem.attributes.dy.value : 0,
      defFontFamily = 'serief',
      defFontWeight = 'normal',
      defFontSize = '16px',
      bBox = [],
      defCSSprop,
      fontFamily,
      fontWeight,
      textAlign,
      fontSize;
    if (doc.getElementsByTagName('body')[0]) {
      defCSSprop = win.getComputedStyle(doc.getElementsByTagName('body')[0], null);
      if (defCSSprop.getPropertyValue('font-family')) {
        defFontFamily = defCSSprop.getPropertyValue('font-family');
      }
      if (defCSSprop.getPropertyValue('font-weight')) {
        defFontWeight = defCSSprop.getPropertyValue('font-weight');
      }
      if (defCSSprop.getPropertyValue('font-size')) {
        defFontSize = defCSSprop.getPropertyValue('font-size');
      }
    }
    fontFamily = elem.attributes['font-family']
      ? elem.attributes['font-family'].value
      : defFontFamily;
    fontWeight = elem.attributes['font-weight']
      ? elem.attributes['font-weight'].value
      : defFontWeight;
    textAlign = elem.attributes['text-anchor'] ? elem.attributes['text-anchor'].value : 'start';
    fontSize = elem.attributes['font-size'] ? elem.attributes['font-size'].value : defFontSize;
    x = Number(x) + Number(dx);
    y = Number(y) + Number(dy);
    text = text.trim();
    textAlign = textAlign === 'middle' ? 'center' : textAlign;
    context.save();
    context.font = fontWeight + ' ' + fontSize + ' ' + fontFamily;

    context.textAlign = textAlign;
    if (pps === 'draw') {
      if (!elem.attributes.fill || (elem.attributes.fill && elem.attributes.fill.value !== 'none')) {
        utilLib.applyFillEffect(elem, context, svgDeCanvo, bBox);
        context.fillText(text, x, y);
        utilLib.endFillEffect(elem, context);
      }
      if (
        !elem.attributes.stroke ||
        (elem.attributes.stroke && elem.attributes.stroke.value !== 'none')
      ) {
        utilLib.applyStrokeEffect(elem, context, svgDeCanvo, bBox);
        context.strokeText(text, x, y);
        utilLib.endStrokeEffect(elem, context);
      }
    }
    context.restore();
    if (typeof callBackFn === 'function') {
      callBackFn();
    }
  };

  drawLib.drawcircle = function (elem, context, svgDeCanvo, pps, callBackFn) {
    var cx = Number(elem.attributes.cx.value),
      cy = Number(elem.attributes.cy.value),
      r = Number(elem.attributes.r.value),
      bBox = [];

    context.beginPath();
    context.arc(cx, cy, r, 0, Math.PI * 2);
    utilLib.bBoxFromPoint(
      [cx, cx * 1 + r * 1, cx * 1 - r * 1],
      [cy, cy * 1 + r * 1, cy * 1 - r * 1],
      bBox
    );
    if (pps === 'draw') {
      if (!elem.attributes.fill || (elem.attributes.fill && elem.attributes.fill.value !== 'none')) {
        utilLib.applyFillEffect(elem, context, svgDeCanvo, bBox);
        context.fill();
        utilLib.endFillEffect(elem, context);
      }
      if (
        !elem.attributes.stroke ||
        (elem.attributes.stroke && elem.attributes.stroke.value !== 'none')
      ) {
        utilLib.applyStrokeEffect(elem, context, svgDeCanvo, bBox);
        context.stroke();
        utilLib.endStrokeEffect(elem, context);
      }
    }
    context.closePath();
    if (typeof callBackFn === 'function') {
      callBackFn();
    }
  };

  drawLib.drawrect = function (elem, context, svgDeCanvo, pps, callBackFn) {
    var x = Number(elem.attributes.x.value),
      y = Number(elem.attributes.y.value),
      rx = elem.attributes.rx ? Number(elem.attributes.rx.value) : 0,
      ry = elem.attributes.ry ? Number(elem.attributes.ry.value) : 0,
      height = Number(elem.attributes.height.value),
      width = Number(elem.attributes.width.value),
      bBox = [];

    utilLib.bBoxFromPoint([x, x + width], [y, y + height], bBox);
    context.beginPath();
    context.moveTo(x + rx, y);
    context.lineTo(x + width - rx, y);
    context.quadraticCurveTo(x + width, y, x + width, y + ry);
    context.lineTo(x + width, y + height - ry);
    context.quadraticCurveTo(x + width, y + height, x + width - rx, y + height);
    context.lineTo(x + rx, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - ry);
    context.lineTo(x, y + ry);
    context.quadraticCurveTo(x, y, x + rx, y);
    if (pps === 'draw') {
      if (!elem.attributes.fill || (elem.attributes.fill && elem.attributes.fill.value !== 'none')) {
        utilLib.applyFillEffect(elem, context, svgDeCanvo, bBox);
        context.fill();
        utilLib.endFillEffect(elem, context);
      }
      if (
        !elem.attributes.stroke ||
        (elem.attributes.stroke && elem.attributes.stroke.value !== 'none')
      ) {
        utilLib.applyStrokeEffect(elem, context, svgDeCanvo, bBox);
        context.stroke();
        utilLib.endStrokeEffect(elem, context);
      }
    }
    context.closePath();
    if (typeof callBackFn === 'function') {
      callBackFn();
    }
  };

  drawLib.drawellipse = function (elem, context, svgDeCanvo, pps, callBackFn) {
    var kappa = 0.5522848,
      cx = Number(elem.attributes.cx.value),
      cy = Number(elem.attributes.cy.value),
      rx = Number(elem.attributes.rx.value),
      ry = Number(elem.attributes.ry.value),
      ox = rx * kappa,
      oy = ry * kappa,
      xe = cx + rx,
      ye = cy + ry,
      bBox = [];

    context.beginPath();

    context.moveTo(cx - rx, cy);
    context.bezierCurveTo(cx - rx, cy - oy, cx - ox, cy - ry, cx, cy - ry);
    context.bezierCurveTo(cx + ox, cy - ry, xe, cy - oy, xe, cy);
    context.bezierCurveTo(xe, cy + oy, cx + ox, ye, cx, ye);
    context.bezierCurveTo(cx - ox, ye, cx - rx, cy + oy, cx - rx, cy);

    utilLib.bBoxFromPoint([cx + rx, cx - rx], [cy + ry, cy - ry], bBox);
    if (pps === 'draw') {
      if (!elem.attributes.fill || (elem.attributes.fill && elem.attributes.fill.value !== 'none')) {
        utilLib.applyFillEffect(elem, context, svgDeCanvo, bBox);
        context.fill();
        utilLib.endFillEffect(elem, context);
      }
      if (
        !elem.attributes.stroke ||
        (elem.attributes.stroke && elem.attributes.stroke.value !== 'none')
      ) {
        utilLib.applyStrokeEffect(elem, context, svgDeCanvo, bBox);
        context.stroke();
        utilLib.endStrokeEffect(elem, context);
      }
    }
    context.closePath();
    if (typeof callBackFn === 'function') {
      callBackFn();
    }
  };

  drawLib.drawimage = function (elem, context, svgDeCanvo, pps, callBackFn) {
    var x = elem.attributes.x ? Number(elem.attributes.x.value) : 0,
      y = elem.attributes.y ? Number(elem.attributes.y.value) : 0,
      height = elem.attributes.height ? Number(elem.attributes.height.value) : 0,
      width = elem.attributes.width ? Number(elem.attributes.width.value) : 0,
      imgUrl,
      imageArr = svgDeCanvo._getStore('imageArr');

    context.save();
    if (elem.attributes.opacity) {
      context.globalAlpha = elem.attributes.opacity.value;
    }

    if (elem.attributes['xlink:href']) {
      imgUrl = elem.attributes['xlink:href'].value;
      if (imageArr[imgUrl].status === 'complete') {
        context.drawImage(imageArr[imgUrl].obj, x, y, width, height);
        context.globalAlpha = 1;
        context.restore();
        if (typeof callBackFn === 'function') {
          callBackFn();
        }
      } else if (imageArr[imgUrl].status === 'error') {
        context.globalAlpha = 1;
        context.restore();
        if (typeof callBackFn === 'function') {
          callBackFn();
        }
      } else if (imageArr[imgUrl].status === 'progress') {
        imageArr[imgUrl].callback = function () {
          context.drawImage(imageArr[imgUrl].obj, x, y, width, height);
          context.globalAlpha = 1;
          context.restore();
          if (typeof callBackFn === 'function') {
            callBackFn();
          }
        };
        imageArr[imgUrl].errCallback = function () {
          context.globalAlpha = 1;
          context.restore();
          if (typeof callBackFn === 'function') {
            callBackFn();
          }
        };
      } else {
        context.globalAlpha = 1;
        context.restore();
        if (typeof callBackFn === 'function') {
          callBackFn();
        }
      }
    } else {
      context.globalAlpha = 1;
      context.restore();
      if (typeof callBackFn === 'function') {
        callBackFn();
      }
    }
  };

  /**
   * method for drawing the path attribute of SVG onto the canvas
   * @param {attribute object} elem - the object containing all the attribute required
   * the drawing purpose.
   */
  drawLib.drawpath = function (elem, context, svgDeCanvo, pps, callBackFn) {
    var subPath = elem.attributes.d.value.match(/[a-z][^a-z"]*/gi),
      bBox = [],
      a,
      cmdName,
      cmdDetails,
      cx = 0,
      cy = 0,
      i;

    context.beginPath();
    // The switch statement decide which part to draw.
    for (a in subPath) {
      if (!subPath.hasOwnProperty(a)) {
        continue;
      }
      cmdName = subPath[a].substring(0, 1);
      cmdDetails = utilLib.getArgsAsArray(subPath[a].substring(1, subPath[a].length));
      switch (cmdName) {
        case 'M':
          cx = Number(cmdDetails[0]);
          cy = Number(cmdDetails[1]);
          context.moveTo(cx, cy);
          break;
        case 'm':
          cx += Number(cmdDetails[0]);
          cy += Number(cmdDetails[1]);
          context.moveTo(cx, cy);
          break;
        case 'L':
          for (i = 0; cmdDetails[i]; i += 2) {
            utilLib.bBoxFromPoint([cx, cmdDetails[i]], [cy, cmdDetails[i + 1]], bBox);
            cx = Number(cmdDetails[i]);
            cy = Number(cmdDetails[i + 1]);
            context.lineTo(cx, cy);
          }
          break;
        case 'l':
          for (i = 0; cmdDetails[i]; i += 2) {
            utilLib.bBoxFromPoint(
              [cx, cx * 1 + 1 * cmdDetails[i]],
              [cy, cy * 1 + 1 * cmdDetails[i + 1]],
              bBox
            );
            cx += Number(cmdDetails[i]);
            cy += Number(cmdDetails[i + 1]);
            context.lineTo(cx, cy);
          }
          break;
        case 'V':
          for (i = 0; cmdDetails[i]; i += 1) {
            utilLib.bBoxFromPoint([cx], [cy, cmdDetails[i]], bBox);
            cy = Number(cmdDetails[i]);
            context.lineTo(cx, cy);
          }
          break;
        case 'v':
          for (i = 0; cmdDetails[i]; i += 1) {
            utilLib.bBoxFromPoint([cx], [cy, cy * 1 + 1 * cmdDetails[i]], bBox);
            cy += Number(cmdDetails[i]);
            context.lineTo(cx, cy);
          }
          break;
        case 'H':
          for (i = 0; cmdDetails[i]; i += 1) {
            utilLib.bBoxFromPoint([cx, cmdDetails[i]], [cy], bBox);
            cx = Number(cmdDetails[i]);
            context.lineTo(cx, cy);
          }
          break;
        case 'h':
          for (i = 0; cmdDetails[i]; i += 1) {
            utilLib.bBoxFromPoint([cx, cx * 1 + 1 * cmdDetails[i]], [cy], bBox);
            cx += Number(cmdDetails[i]);
            context.lineTo(cx, cy);
          }
          break;
        case 'Q':
          for (i = 0; cmdDetails[i]; i += 4) {
            utilLib.qBezierBBox(
              cx,
              cy,
              cmdDetails[i],
              cmdDetails[i + 1],
              cmdDetails[i + 2],
              cmdDetails[i + 3],
              bBox
            );
            context.quadraticCurveTo(
              Number(cmdDetails[i]),
              Number(cmdDetails[i + 1]),
              Number(cmdDetails[i + 2]),
              Number(cmdDetails[i + 3])
            );
            cx = Number(cmdDetails[i + 2]);
            cy = Number(cmdDetails[i + 3]);
          }
          break;
        case 'q':
          for (i = 0; cmdDetails[i]; i += 4) {
            utilLib.qBezierBBox(
              cx,
              cy,
              cx + 1 * cmdDetails[i],
              cy + 1 * cmdDetails[i + 1],
              cx * 1 + 1 * cmdDetails[i + 2],
              cy * 1 + 1 * cmdDetails[i + 3],
              bBox
            );
            context.quadraticCurveTo(
              cx + 1 * cmdDetails[i],
              cy + 1 * cmdDetails[i + 1],
              (cx += Number(cmdDetails[i + 2])),
              (cy += Number(cmdDetails[i + 3]))
            );
          }
          break;
        case 'C':
          for (i = 0; cmdDetails[i]; i += 6) {
            utilLib.cBezierBBox(
              cx,
              cy,
              cmdDetails[i],
              cmdDetails[i + 1],
              cmdDetails[i + 2],
              cmdDetails[i + 3],
              cmdDetails[i + 4],
              cmdDetails[i + 5],
              bBox
            );
            context.bezierCurveTo(
              cmdDetails[i],
              cmdDetails[i + 1],
              cmdDetails[i + 2],
              cmdDetails[i + 3],
              cmdDetails[i + 4],
              cmdDetails[i + 5]
            );
            cx = Number(cmdDetails[i + 4]);
            cy = Number(cmdDetails[i + 5]);
          }
          break;
        case 'c':
          for (i = 0; cmdDetails[i]; i += 6) {
            utilLib.cBezierBBox(
              cx,
              cy,
              cx + 1 * cmdDetails[i],
              cy * 1 + 1 * cmdDetails[i + 1],
              cx + 1 * cmdDetails[i + 2],
              cy * 1 + 1 * cmdDetails[i + 3],
              cx + 1 * cmdDetails[i + 4],
              cy * 1 + 1 * cmdDetails[i + 5],
              bBox
            );
            context.bezierCurveTo(
              cx + Number(cmdDetails[i]),
              cy + Number(cmdDetails[i + 1]),
              cx + Number(cmdDetails[i + 2]),
              cy + Number(cmdDetails[i + 3]),
              (cx += Number(cmdDetails[i + 4])),
              (cy += Number(cmdDetails[i + 5]))
            );
          }

          break;
        case 'a':
        case 'A':
          for (i = 0; cmdDetails[i]; i += 7) {
            // eslint-disable-next-line
            var rx = Number(cmdDetails[i]),
              ry = Number(cmdDetails[i + 1]),
              xAngle,
              aFlag,
              sFlag,
              ex,
              ey,
              x1,
              y1,
              signValue,
              s2sqrt,
              centx1,
              centy1,
              centx,
              centy,
              startAngle,
              dAngle,
              rErrFlag,
              radius,
              xShift,
              yShift;

            // Converting to radian
            xAngle = Number(cmdDetails[i + 2]) * (Math.PI / 180);
            aFlag = Number(cmdDetails[i + 3]);
            sFlag = Number(cmdDetails[i + 4]);
            ex = Number(cmdDetails[i + 5]);
            ey = Number(cmdDetails[i + 6]);
            // http://www.w3.org/TR/SVG/implnote.html#ArcConversionEndpointToCenter
            // Calculation are based on the above link
            // Step 1
            x1 = Math.cos(xAngle) * (cx - ex) / 2 + Math.sin(xAngle) * (cy - ey) / 2;
            y1 = -Math.sin(xAngle) * (cx - ex) / 2 + Math.cos(xAngle) * (cy - ey) / 2;

            // moding the radius value
            rx = rx < 0 ? -rx : rx;
            ry = ry < 0 ? -ry : ry;
            rErrFlag = Math.pow(x1, 2) / Math.pow(rx, 2) + Math.pow(y1, 2) / Math.pow(ry, 2);
            if (rErrFlag > 1) {
              rx *= Math.sqrt(rErrFlag);
              ry *= Math.sqrt(rErrFlag);
            }
            radius = rx > ry ? rx : ry;
            xShift = rx > ry ? 1 : rx / ry;
            yShift = rx > ry ? ry / rx : 1;

            // Step 2
            signValue = aFlag === sFlag ? -1 : 1;
            // Take the square root part as an variable
            s2sqrt =
              signValue *
              Math.sqrt(
                (Math.pow(rx, 2) * Math.pow(ry, 2) -
                  Math.pow(rx, 2) * Math.pow(y1, 2) -
                  Math.pow(ry, 2) * Math.pow(x1, 2)) /
                  (Math.pow(rx, 2) * Math.pow(y1, 2) + Math.pow(ry, 2) * Math.pow(x1, 2))
              );
            if (isNaN(s2sqrt)) {
              s2sqrt = 0;
            }
            centx1 = s2sqrt * (rx * y1) / ry;
            centy1 = -s2sqrt * (ry * x1) / rx;
            // Step 3
            centx = centx1 * Math.cos(xAngle) - centy1 * Math.sin(xAngle) + (cx + ex) / 2;
            centy = centx1 * Math.sin(xAngle) + centy1 * Math.cos(xAngle) + (cy + ey) / 2;
            // Step 4 computing the Angles
            startAngle = utilLib.angleBetweenVectors(1, 0, (x1 - centx1) / rx, (y1 - centy1) / ry);
            dAngle = utilLib.angleBetweenVectors(
              (x1 - centx1) / rx,
              (y1 - centy1) / ry,
              (-x1 - centx1) / rx,
              (-y1 - centy1) / ry
            );

            // Moding the end angle
            if (sFlag === 0 && dAngle > 0) {
              dAngle -= 360 * (Math.PI / 180);
            }
            if (sFlag === 1 && dAngle < 0) {
              dAngle += 360 * (Math.PI / 180);
            }
            // Check the condition for radius
            if (rx === 0 && ry === 0) {
              context.lineTo(ex, ey);
              break;
            }

            context.save();
            /* context.translate( centx, centy );
                          context.rotate( xAngle );
                          context.scale(xShift, yShift); */
            // eslint-disable-next-line
            var transformMatrix = utilLib.combineTransformMatrix([
              [1, 0, centx, 0, 1, centy],
              [Math.cos(xAngle), Math.sin(xAngle), 0, Math.sin(xAngle), Math.cos(xAngle), 0],
              [xShift, 0, 0, 0, yShift, 0]
            ]);
            context.transform(
              transformMatrix[0],
              transformMatrix[3],
              transformMatrix[1],
              transformMatrix[4],
              transformMatrix[2],
              transformMatrix[5]
            );
            context.arc(0, 0, radius, startAngle, startAngle + dAngle, 1 - sFlag);
            context.restore();
            utilLib.arcBBox(
              0,
              0,
              radius,
              startAngle,
              startAngle + dAngle,
              1 - sFlag,
              [
                transformMatrix[0],
                transformMatrix[3],
                transformMatrix[1],
                transformMatrix[4],
                transformMatrix[2],
                transformMatrix[5]
              ],
              bBox
            );
            // utilLib.bBoxFromPoint([cx, ex], [cy, ey], bBox);

            if (cmdName === 'A') {
              cx = Number(cmdDetails[i + 5]);
              cy = Number(cmdDetails[i + 6]);
            } else {
              cx += Number(cmdDetails[i + 5]);
              cy += Number(cmdDetails[i + 6]);
            }
          }
          break;
        case 'Z':
        case 'z':
          context.closePath();
          break;
        default:
      }
    }
    if (pps === 'draw') {
      if (!elem.attributes.fill || (elem.attributes.fill && elem.attributes.fill.value !== 'none')) {
        utilLib.applyFillEffect(elem, context, svgDeCanvo, bBox);
        context.fill();
        utilLib.endFillEffect(elem, context);
      }
      if (
        !elem.attributes.stroke ||
        (elem.attributes.stroke && elem.attributes.stroke.value !== 'none')
      ) {
        utilLib.applyStrokeEffect(elem, context, svgDeCanvo, bBox);
        context.stroke();
        utilLib.endStrokeEffect(elem, context);
      }
      callBackFn();
    }
  };

  /** ************************* Draw Methods End *****************************/

  /** ************************ Support Methods start **************************
   * Below are the functions that will be usefull for drawing                *
   * All reusuable method stays here                                         *
   ***************************************************************************/

  utilLib.drawNodes = function (nodeArr, attrib, svgDeCanvo, context, callBack) {
    var l = nodeArr.length,
      i = -1,
      dx = 0,
      dy = 0,
      callBackFn = function () {
        var node;
        i = i + 1;
        if (i < l) {
          node = nodeArr[i];
          if (node.tagName && node.tagName === 'defs') {
            i = i + 1;
            node = nodeArr[i];
          }
          if (node.attributes) {
            // adjusting the dx dy
            if (node.attributes.dy) {
              dy = node.attributes.dy.value = node.attributes.dy.value * 1 + dy * 1;
            }
            // adjusting the dx dy
            if (node.attributes.dx) {
              dx = node.attributes.dx.value = node.attributes.dx.value * 1 + dx * 1;
            }
          }
          drawLib.common(node, attrib, svgDeCanvo, context, callBackFn);
        } else {
          callBack && callBack();
        }
      };
    callBackFn();
  };

  utilLib.getSvgDimention = function (svg) {
    var ret = {
        width: 0,
        height: 0
      },
      node;

    node = svg.childNodes && svg.childNodes[0] && svg.childNodes[0].attributes;
    ret.width = Number((node.width && node.width.value) || 0);
    ret.height = Number((node.height && node.height.value) || 0);
    return ret;
  };

  utilLib.storeImagesInArr = function (svgDeCanvo) {
    var svg = svgDeCanvo.getSVG(),
      imgElem,
      imgUrl,
      imageArr,
      i;
    imageArr = svgDeCanvo._getStore('imageArr');
    imgElem = svg.getElementsByTagName('image');
    for (i in imgElem) {
      if (!imgElem.hasOwnProperty(i)) {
        continue;
      }
      if (imgElem[i].attributes && imgElem[i].attributes['xlink:href']) {
        imgUrl = imgElem[i].attributes['xlink:href'].value;
        if (!imageArr[imgUrl]) {
          imageArr[imgUrl] = [];
          imageArr[imgUrl].status = 'progress';
          imageArr[imgUrl].callback = null;
          imageArr[imgUrl].obj = new Image();
          imageArr[imgUrl].obj.onload = (function (imgUrl) {
            return function () {
              var callback = imageArr[imgUrl].callback;
              if (callback) {
                imageArr[imgUrl].status = 'complete';
                callback();
              } else {
                imageArr[imgUrl].status = 'complete';
              }
            };
          })(imgUrl);
          imageArr[imgUrl].obj.onerror = (function (imgUrl) {
            return function () {
              var errCallback = imageArr[imgUrl].errCallback;
              if (errCallback) {
                imageArr[imgUrl].status = 'error';
                errCallback();
              } else {
                imageArr[imgUrl].status = 'error';
              }
            };
          })(imgUrl);
          imageArr[imgUrl].obj.src = imgUrl;
        }
      }
    }
  };

  /**
   * Method to handle the various transformation
   * @param {Context} ctx - the context of the canvas where to apply the transformation
   * @param {data} the data that contain the transformation information-
   * data can be like matrix(1,0,0,1,230,345) rotate(34) seperated by coma.
   * @TODO - support the other transformation methods
   */
  utilLib.startTransform = function (data, context) {
    var t = data.match(/[^\s][a-z,0-9.\-(\s]+\)/gi),
      args,
      i;
    // Loop through every transformation
    for (i in t) {
      if (!t.hasOwnProperty(i)) {
        continue;
      }
      if (t[i].indexOf('matrix') > -1) {
        args = utilLib.stringToArgs(t[i]);
        context.transform(args[0], args[1], args[2], args[3], args[4], args[5]);
      }
      if (t[i].indexOf('translate') > -1) {
        args = utilLib.stringToArgs(t[i]);
        context.translate(args[0] || 0, args[1] || 0);
      }
      if (t[i].indexOf('rotate') > -1) {
        args = utilLib.stringToArgs(t[i]);
        if (args.length === 3) {
          context.translate(args[1], args[2]);
          context.rotate(args[0] * (Math.PI / 180));
          context.translate(-args[1], -args[2]);
        } else {
          context.rotate(args[0] * (Math.PI / 180));
        }
      }
      if (t[i].indexOf('scale') > -1) {
        args = utilLib.stringToArgs(t[i]);
        if (args.length === 1) {
          context.scale(args[0] || 1, args[0] || 1);
        } else {
          context.scale(args[0] || 1, args[1] || 1);
        }
      }
      if (t[i].indexOf('skewX') > -1) {
        args = utilLib.stringToArgs(t[i]);
        context.transform(1, 0, Math.tan(args[0] * (Math.PI / 180)), 1, 0, 0);
      }
      if (t[i].indexOf('skewY') > -1) {
        args = utilLib.stringToArgs(t[i]);
        context.transform(1, Math.tan(args[0] * (Math.PI / 180)), 0, 1, 0, 0);
      }
    }
  };

  /**
   * Method that restore the canvas to its original position
   */
  utilLib.resetTransform = function (context) {
    context.setTransform(1, 0, 0, 1, 0, 0);
  };

  /**
   * Method that give argument from a function type definition
   * ex - for string function( abc, def ) this function will return
   * abc and def in an array.
   * @param {string} data - the striing from which the args to be extracted.
   */
  utilLib.stringToArgs = function (data) {
    var insideBracket = /\(([^)]+)/.exec(data)[1];
    return utilLib.getArgsAsArray(insideBracket);
  };

  /**
   * Method that return coma or space seperated string as array.
   * @param {atring} data - the string from which the ars should be extracted
   */
  utilLib.getArgsAsArray = function (data) {
    var i;
    data = data.trim().split(/[\s,]+/);

    for (i = 0; i < data.length; i++) {
      data[i].trim();
      if (data[i].length === 0) {
        data.splice(i, 1);
      }
    }
    return data;
  };

  utilLib.applyFillEffect = function (elem, context, svgDeCanvo, bBox) {
    var fillValue;
    if (elem.attributes['fill-opacity'] && elem.attributes['fill-opacity'].value !== 'none') {
      context.globalAlpha = elem.attributes['fill-opacity'].value;
    } else {
      context.globalAlpha = 1;
    }

    if (elem.attributes.fill && elem.attributes.fill.value.indexOf('url(') > -1) {
      fillValue = utilLib.getFillStyleById(
        /url\(.*#([^)'"]+)/.exec(elem.attributes.fill.value)[1],
        context,
        svgDeCanvo,
        bBox
      );
      context.fillStyle = fillValue;
    } else {
      if (elem.attributes.fill) {
        context.fillStyle = elem.attributes.fill.value;
      } else {
        context.fillStyle = '#000000';
      }
    }
  };

  utilLib.endFillEffect = function (elem, context) {
    context.globalAlpha = 1;
  };

  utilLib.applyStrokeEffect = function (elem, context, svgDeCanvo, bBox) {
    if (elem.attributes['stroke-opacity'] && elem.attributes['stroke-opacity'].value !== 'none') {
      context.globalAlpha = elem.attributes['stroke-opacity'].value;
    }
    if (elem.attributes['stroke-width']) {
      context.lineWidth = elem.attributes['stroke-width'].value;
      if (elem.attributes['stroke-width'].value === '0') {
        context.globalAlpha = 0;
      }
    }
    if (elem.attributes['stroke-linecap'] && elem.attributes['stroke-linecap'].value !== 'none') {
      context.lineCap = elem.attributes['stroke-linecap'].value;
    }
    if (elem.attributes['stroke-linejoin'] && elem.attributes['stroke-linejoin'].value !== 'none') {
      context.lineJoin = elem.attributes['stroke-linejoin'].value;
    }
    if (
      elem.attributes['stroke-dasharray'] &&
      elem.attributes['stroke-dasharray'].value !== 'none' &&
      context.setLineDash
    ) {
      context.setLineDash(utilLib.getArgsAsArray(elem.attributes['stroke-dasharray'].value));
    }
    if (elem.attributes.stroke) {
      context.strokeStyle = elem.attributes.stroke.value;
    } else {
      context.strokeStyle = '#000000';
    }
  };

  utilLib.endStrokeEffect = function (elem, context) {
    if (elem.attributes['stroke-opacity'] && elem.attributes['stroke-opacity'].value !== 'none') {
      context.globalAlpha = 1;
      if (context.setLineDash) {
        context.setLineDash([]);
      }
      context.lineWidth = 1;
    }
    context.globalAlpha = 1;
  };

  utilLib.applyClip = function (id, context, svgDeCanvo) {
    var svg = svgDeCanvo.getSVG(),
      elemId,
      elem,
      chldrn,
      a,
      fncName;

    if (id.indexOf('url(') === -1) {
      return;
    }
    elemId = /url\(.*#([^)'"]+)/.exec(id)[1];
    elem = svg.getElementById(elemId);
    if (elem.attributes) {
      context.save();
      if (elem.attributes.transform) {
        utilLib.startTransform(elem.attributes.transform.value, context);
      }
    }
    chldrn = elem.childNodes;
    for (a in chldrn) {
      if (!chldrn.hasOwnProperty(a)) {
        continue;
      }
      if (!chldrn[a].tagName) {
        continue;
      }
      if (chldrn[a].constructor !== Array) {
        fncName = 'draw' + chldrn[a].tagName;
        if (chldrn[a].attributes) {
          context.save();
          if (chldrn[a].attributes.transform) {
            utilLib.startTransform(chldrn[a].attributes.transform.value, context);
          }
        }
        if (drawLib[fncName]) {
          drawLib[fncName](chldrn[a], context, svgDeCanvo, 'clip');
          context.closePath();
        }
        if (chldrn[a].attributes) {
          context.restore();
        }
      }
    }
    if (elem.attributes) {
      context.restore();
    }
    context.clip();
  };

  utilLib.getFillStyleById = function (id, context, svgDeCanvo, bBox) {
    var svg = svgDeCanvo.getSVG(),
      gradElem = svg.getElementById(id);
    /* context.strokeRect(bBox.xMin, bBox.yMin, bBox.xMax - bBox.xMin,
          bBox.yMax - bBox.yMin); */
    if (gradElem.tagName === 'linearGradient') {
      return utilLib.getLinearGradient(gradElem, context, bBox);
    }
    if (gradElem.tagName === 'radialGradient') {
      return utilLib.getRadialGradient(gradElem, context, bBox);
    }
    return '#FFFFFF';
  };

  utilLib.getLinearGradient = function (element, context, bBox) {
    var sx = element.attributes.x1
        ? utilLib.getPercentValue(element.attributes.x1.value, bBox.xMax - bBox.xMin, bBox.xMin)
        : 0,
      sy = element.attributes.y1
        ? utilLib.getPercentValue(element.attributes.y1.value, bBox.yMax - bBox.yMin, bBox.yMin)
        : 0,
      ex = element.attributes.x2
        ? utilLib.getPercentValue(element.attributes.x2.value, bBox.xMax - bBox.xMin, bBox.xMin)
        : 0,
      ey = element.attributes.y2
        ? utilLib.getPercentValue(element.attributes.y2.value, bBox.yMax - bBox.yMin, bBox.yMin)
        : 0,
      linGrad,
      children,
      a,
      color,
      opacity;

    linGrad = context.createLinearGradient(sx, sy, ex, ey);
    children = element.childNodes;
    for (a in children) {
      if (!children.hasOwnProperty(a)) {
        continue;
      }
      if (children[a].attributes && children[a].attributes['stop-color']) {
        color = utilLib.toRGB(children[a].attributes['stop-color'].value);
        opacity = children[a].attributes['stop-opacity']
          ? children[a].attributes['stop-opacity'].value
          : 1;
        if (color.status) {
          linGrad.addColorStop(
            utilLib.getPercentValue(children[a].attributes.offset.value, 1, 0),
            'rgba(' + color.r + ',' + color.g + ',' + color.b + ',' + Number(opacity) + ')'
          );
        } else {
          linGrad.addColorStop(
            utilLib.getPercentValue(children[a].attributes.offset.value, 1, 0),
            children[a].attributes['stop-color'].value
          );
        }
      }
    }
    return linGrad;
  };

  utilLib.getRadialGradient = function (element, context, bBox) {
    var cx = element.attributes.cx
        ? utilLib.getPercentValue(element.attributes.cx.value, bBox.xMax - bBox.xMin, bBox.xMin)
        : bBox.xMin + (bBox.xMax - bBox.xMin) * 0.5,
      cy = element.attributes.cy
        ? utilLib.getPercentValue(element.attributes.cy.value, bBox.yMax - bBox.yMin, bBox.yMin)
        : bBox.yMin + (bBox.yMax - bBox.yMin) * 0.5,
      fx = element.attributes.fx
        ? utilLib.getPercentValue(element.attributes.fx.value, bBox.xMax - bBox.xMin, bBox.xMin)
        : bBox.xMin + (bBox.xMax - bBox.xMin) * 0.5,
      fy = element.attributes.fy
        ? utilLib.getPercentValue(element.attributes.fy.value, bBox.yMax - bBox.yMin, bBox.yMin)
        : bBox.yMin + (bBox.yMax - bBox.yMin) * 0.5,
      r = element.attributes.r
        ? utilLib.getPercentValue(
          element.attributes.r.value,
          (bBox.yMax - bBox.yMin + bBox.xMax - bBox.xMin) / 2,
          0
        )
        : utilLib.getPercentValue('50%', (bBox.yMax - bBox.yMin + bBox.xMax - bBox.xMin) / 2, 0),
      radGrad,
      children,
      a,
      color,
      opacity;

    radGrad = context.createRadialGradient(fx, fy, 0, cx, cy, r);
    children = element.childNodes;
    for (a in children) {
      if (!children.hasOwnProperty(a)) {
        continue;
      }
      if (children[a].attributes && children[a].attributes['stop-color']) {
        color = utilLib.toRGB(children[a].attributes['stop-color'].value);
        opacity = children[a].attributes['stop-opacity']
          ? children[a].attributes['stop-opacity'].value
          : 1;
        if (color.status) {
          radGrad.addColorStop(
            utilLib.getPercentValue(children[a].attributes.offset.value, 1, 0),
            'rgba(' + color.r + ',' + color.g + ',' + color.b + ',' + Number(opacity) + ')'
          );
        } else {
          radGrad.addColorStop(
            utilLib.getPercentValue(children[a].attributes.offset.value, 1, 0),
            children[a].attributes['stop-color'].value
          );
        }
      }
    }
    return radGrad;
  };

  utilLib.getPercentValue = function (percent, value, correction) {
    var mVal;
    if (percent.indexOf('%') !== -1) {
      mVal = /(\d.*)%/.exec(percent)[1];
      if (mVal > 100) {
        mVal = 100;
      }
      return mVal * value / 100 + correction * 1;
    } else {
      if (percent > 1) {
        return percent;
      }
      return percent * value + correction * 1;
    }
  };

  utilLib.bBoxFromPoint = function (xPointArr, yPointArr, bBox) {
    if (typeof bBox.xMin !== 'undefined') {
      xPointArr.push(bBox.xMin, bBox.xMax);
      yPointArr.push(bBox.yMin, bBox.yMax);
    }
    bBox.xMin = Math.min.apply(this, xPointArr);
    bBox.xMax = Math.max.apply(this, xPointArr);
    bBox.yMin = Math.min.apply(this, yPointArr);
    bBox.yMax = Math.max.apply(this, yPointArr);
  };

  /**
   * Method to compute the bounding box but its not working as expected
   */
  utilLib.arcBBox = function (cx, cy, r, sa, ea, cc, transform, bBox) {
    var rsa,
      rea,
      startArcX,
      endArcX,
      startArcY,
      endArcY,
      xMin,
      yMin,
      xMax,
      yMax,
      xArr,
      yArr,
      isBetween;

    if (transform instanceof Array) {
      cx = cx * transform[0] + cx * transform[2] + transform[4];
      cy = cy * transform[1] + cy * transform[3] + transform[5];
    }
    isBetween = function (start, end, angle) {
      // making the start angle and end angle negative
      start = (start + 2 * Math.PI) % (2 * Math.PI);
      end = (end + 2 * Math.PI) % (2 * Math.PI);
      if (start <= end) {
        if (start <= angle && angle <= end) {
          return true;
        } else {
          return false;
        }
      } else if (start >= end) {
        if (start >= angle && angle >= end) {
          return false;
        } else {
          return true;
        }
      }
    };
    rsa = sa % (2 * Math.PI);
    rea = ea % (2 * Math.PI);
    if (cc) {
      rsa = ea % (2 * Math.PI);
      rea = sa % (2 * Math.PI);
    }
    startArcX = cx + r * Math.cos(rsa);
    startArcY = cy + r * Math.sin(rsa);
    endArcX = cx + r * Math.cos(rea);
    endArcY = cy + r * Math.sin(rea);

    xArr = [startArcX, endArcX];
    yArr = [startArcY, endArcY];

    if (isBetween(rsa, rea, 0)) {
      xArr.push(cx * 1 + r * 1);
      yArr.push(cy);
    }
    if (isBetween(rsa, rea, 0.5 * Math.PI)) {
      xArr.push(cx);
      yArr.push(cy * 1 + r * 1);
    }
    if (isBetween(rsa, rea, Math.PI)) {
      xArr.push(cx - r * 1);
      yArr.push(cy);
    }
    if (isBetween(rsa, rea, 1.5 * Math.PI)) {
      xArr.push(cx);
      yArr.push(cy - r * 1);
    }
    xMax = Math.max.apply(this, xArr);
    xMin = Math.min.apply(this, xArr);
    yMax = Math.max.apply(this, yArr);
    yMin = Math.min.apply(this, yArr);

    if (typeof bBox.xMin !== 'undefined') {
      bBox.xMin = Math.min(xMin, bBox.xMin);
      bBox.xMax = Math.max(xMax, bBox.xMax);
      bBox.yMin = Math.min(yMin, bBox.yMin);
      bBox.yMax = Math.max(yMax, bBox.yMax);
    } else {
      bBox.xMin = xMin;
      bBox.xMax = xMax;
      bBox.yMin = yMin;
      bBox.yMax = yMax;
    }
  };

  /**
   * Method for calculating the bounding box for quadratic bezier curves
   * @param {co-ordinate point} sx - starting x coordinate
   * @param {co-ordinate point} sy - starting y coordinate
   * @param {co-ordinate point} cx - first control x
   * @param {co-ordinate point} cy - first control y
   * @param {co-ordinate point} ex - end x coordinate
   * @param {co-ordinate point} ey - end y coordinate
   */
  utilLib.qBezierBBox = function (sx, sy, cx, cy, ex, ey, bBox) {
    var txd = sx * 1.0 - 2 * cx + ex * 1.0,
      tyd = sy * 1.0 - 2 * cy + ey * 1.0,
      tx,
      ty,
      xMin,
      yMin,
      xMax,
      yMax,
      curveX,
      curveY;

    // context.beginPath();
    // context.moveTo(sx,sy)
    // for (t = 0 ; t <= 10; t++) {
    // context.lineTo(sx * Math.pow(1 - (t/10), 2) + 2 * cx * (1 - (t/10)) * (t/10) + ex * Math.pow((t/10), 2),
    // sy * Math.pow(1 - (t/10), 2) + 2 * cy * (1 - (t/10)) * (t/10) + ey * Math.pow((t/10), 2))
    // }
    // context.stroke();

    if (txd === 0 || tyd === 0) {
      xMax = Math.max(sx, ex);
      xMin = Math.min(sx, ex);
      yMax = Math.max(sy, ey);
      yMin = Math.min(sy, ey);
    } else {
      tx = (sx - cx) / txd;
      ty = (sy - cy) / tyd;
      curveX = sx * Math.pow(1 - tx, 2) + 2 * cx * (1 - tx) * tx + ex * Math.pow(tx, 2);
      curveY = sy * Math.pow(1 - ty, 2) + 2 * cy * (1 - ty) * ty + ey * Math.pow(ty, 2);

      xMax = Math.max(sx, ex, curveX);
      xMin = Math.min(sx, ex, curveX);
      yMax = Math.max(sy, ey, curveY);
      yMin = Math.min(sy, ey, curveY);
    }

    if (typeof bBox.xMin !== 'undefined') {
      bBox.xMin = Math.min(xMin, bBox.xMin);
      bBox.xMax = Math.max(xMax, bBox.xMax);
      bBox.yMin = Math.min(yMin, bBox.yMin);
      bBox.yMax = Math.max(yMax, bBox.yMax);
    } else {
      bBox.xMin = xMin;
      bBox.xMax = xMax;
      bBox.yMin = yMin;
      bBox.yMax = yMax;
    }
  };

  /**
   * Method for calculating the bounding box for cubic bezier curves
   * @param {co-ordinate point} sx - starting x coordinate
   * @param {co-ordinate point} sy - starting y coordinate
   * @param {co-ordinate point} cx - first control x
   * @param {co-ordinate point} cy - first control y
   * @param {co-ordinate point} c1x - second control x
   * @param {co-ordinate point} c1y - second control y
   * @param {co-ordinate point} ex - end x coordinate
   * @param {co-ordinate point} ey - end y coordinate
   */
  utilLib.cBezierBBox = function (sx, sy, cx, cy, c1x, c1y, ex, ey, bBox) {
    var xMin, xMax, yMin, yMax, a, b, c, root, t1, t2, calculateBound, xTemp, yTemp;
    // Converting the quadratic curve points to cubic curve points
    if (c1x === null && c1y === null) {
      cx = sx + 2.0 / 3.0 * (cx - sx);
      c1x = sy + 2.0 / 3.0 * (cy - sy);
      cy = cx + 1.0 / 3.0 * (ex - sx);
      c1y = c1x + 1.0 / 3.0 * (ey - sy);
    }
    // http://pomax.nihongoresources.com/pages/bezier/
    // details formula
    calculateBound = function (a, b, c, d, t) {
      return (
        a * Math.pow(1 - t, 3) +
        3 * b * t * Math.pow(1 - t, 2) +
        3 * c * t * t * (1 - t) +
        d * t * t * t
      );
    };
    // For x coordinates
    a = 3 * ex - 9 * c1x + 9 * cx - 3 * sx;
    b = 6 * sx - 12 * cx + 6 * c1x;
    c = 3 * cx - 3 * sx;
    root = Math.pow(b, 2) - 4 * a * c;
    xMin = sx;
    xMax = sx;
    if (ex < xMin) {
      xMin = ex;
    }
    if (ex > xMax) {
      xMax = ex;
    }
    if (root >= 0) {
      t1 = (-b + Math.sqrt(root)) / (2 * a);
      if (t1 > 0 && t1 < 1) {
        xTemp = calculateBound(sx, cx, c1x, ex, t1);
        if (xTemp < xMin) {
          xMin = xTemp;
        }
        if (xTemp > xMax) {
          xMax = xTemp;
        }
      }

      t2 = (-b - Math.sqrt(root)) / (2 * a);
      if (t2 > 0 && t2 < 1) {
        xTemp = calculateBound(sx, cx, c1x, ex, t2);
        if (xTemp < xMin) xMin = xTemp;
        if (xTemp > xMax) xMax = xTemp;
      }
    }

    a = 3 * ey - 9 * c1y + 9 * cy - 3 * sy;
    b = 6 * sy - 12 * cy + 6 * c1y;
    c = 3 * cy - 3 * sy;
    root = Math.pow(b, 2) - 4 * a * c;
    yMin = sy;
    yMax = sy;
    if (ey < yMin) yMin = ey;
    if (ey > yMax) yMax = ey;
    if (root >= 0) {
      t1 = (-b + Math.sqrt(root)) / (2 * a);
      if (t1 > 0 && t1 < 1) {
        yTemp = calculateBound(sy, cy, c1y, ey, t1);
        if (yTemp < yMin) {
          yMin = yTemp;
        }
        if (yTemp > yMax) {
          yMax = yTemp;
        }
      }
      t2 = (-b - Math.sqrt(root)) / (2 * a);
      if (t2 > 0 && t2 < 1) {
        yTemp = calculateBound(sy, cy, c1y, ey, t2);
        if (yTemp < yMin) {
          yMin = yTemp;
        }
        if (yTemp > yMax) {
          yMax = yTemp;
        }
      }
    }
    if (typeof bBox.xMin !== 'undefined') {
      bBox.xMin = Math.min(xMin, bBox.xMin);
      bBox.xMax = Math.max(xMax, bBox.xMax);
      bBox.yMin = Math.min(yMin, bBox.yMin);
      bBox.yMax = Math.max(yMax, bBox.yMax);
    } else {
      bBox.xMin = xMin;
      bBox.xMax = xMax;
      bBox.yMin = yMin;
      bBox.yMax = yMax;
    }
  };

  utilLib.combineTransformMatrix = function (matrices) {
    var mlast = matrices.length - 1,
      i,
      resMatrix;
    if (mlast <= 0) {
      return matrices[0];
    }
    resMatrix = matrices[0];
    for (i = 1; i <= mlast; i++) {
      resMatrix[0] = resMatrix[0] * matrices[i][0] + resMatrix[1] * matrices[i][3];
      resMatrix[1] = resMatrix[0] * matrices[i][1] + resMatrix[1] * matrices[i][4];
      resMatrix[2] = resMatrix[0] * matrices[i][2] + resMatrix[1] * matrices[i][5] + resMatrix[2] * 1;
      resMatrix[3] = resMatrix[3] * matrices[i][0] + resMatrix[4] * matrices[i][3];
      resMatrix[4] = resMatrix[3] * matrices[i][1] + resMatrix[4] * matrices[i][4];
      resMatrix[5] = resMatrix[3] * matrices[i][2] + resMatrix[4] * matrices[i][5] + resMatrix[5] * 1;
    }
    return resMatrix;
  };

  /**
   * Method calculating the angle between two vectors
   */
  utilLib.angleBetweenVectors = function (ux, uy, vx, vy) {
    var sign = ux * vy < uy * vx ? -1 : 1,
      dotProduct = ux * vx + uy * vy,
      uMagnitude = Math.sqrt(Math.pow(ux, 2) + Math.pow(uy, 2)),
      vMagnitude = Math.sqrt(Math.pow(vx, 2) + Math.pow(vy, 2));
    return sign * Math.acos(dotProduct / (uMagnitude * vMagnitude));
  };

  utilLib.toRGB = function (color) {
    var rgb = {
        r: 0,
        g: 0,
        b: 0,
        status: 0
      },
      tmpVar,
      prepareRGB,
      a;
    prepareRGB = function (arr) {
      for (a in arr) {
        if (!arr.hasOwnProperty(a)) {
          continue;
        }
        if (arr[a] < 0 || isNaN(arr[a])) {
          arr[a] = 0;
        } else if (arr[a] > 255) {
          arr[a] = 255;
        }
      }
      rgb = {
        r: arr[0],
        g: arr[1],
        b: arr[2],
        status: 1
      };
      return rgb;
    };
    color = color.trim();
    if (color.match(/^rgb\(|^rgba\(/i)) {
      tmpVar = /\(\s*(\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})/.exec(color);
      prepareRGB([parseInt(tmpVar[1]), parseInt(tmpVar[2]), parseInt(tmpVar[3])]);
    } else if (color.match(/^#/)) {
      tmpVar = /(\w{2})(\w{2})(\w{2})/.exec(color);
      prepareRGB([parseInt(tmpVar[1], 16), parseInt(tmpVar[2], 16), parseInt(tmpVar[3], 16)]);
    }
    return rgb;
  };

  /**
   * Method that will convert svg string to dom structure
   * @param {string} str - The svg string
   * @return {DOM Element} - The equivalent dom element of the SVG string
   */
  utilLib.StrToDom = function (str) {
    var parser, doc;

    if (win.DOMParser) {
      parser = new DOMParser();
      doc = parser.parseFromString(str, 'text/xml');
    } else {
      // Internet Explorer
      doc = new win.ActiveXObject('Microsoft.XMLDOM');
      doc.async = false;
      doc.loadXML(str);
    }

    return doc;
  };

  /** ************************ Support Methods end *************************/

  var SvgDeCanvo$1 = SvgDeCanvo;

  return SvgDeCanvo$1;

})));
