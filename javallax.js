/*
 * Javallax - Enables a 3D/parallax effect on web images
 * 
 * (C)2012 - Alessandro Francesconi
 * http://www.alessandrofrancesconi.it/projects/javallax
 *  
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston,
 * MA 02110-1301, USA.
 * 
 */


(function() {
	var JAVALLAX_VERSION = "0.1";
	
	var imageData = []; // will contain all the informations about javallax-enabled images in the page
	
	var LAYERS_COUNT = 6; // how many layers will be generated?
	var X_OFFSET = 3.0; // factor applied to the horizontal movement
	var Y_OFFSET = 1.2; // factor applied to the vertical movement
	
	var ModeEnum = {
		ORIG_DEPTH : 0,
		LR : 1
	};
	
	addLoadEvent(function() {
		// at page load, get all the elements with id "javallax" and iterate into them
		var sourceDivs = getElementsByClass("javallax");
		for (var i = 0; i < sourceDivs.length; i++) {
			imageData[i] = [];
			
			// check what there is inside this container...
			var original = getElementsByClass("javallax-original", sourceDivs[i])[0];
			var depthMap = getElementsByClass("javallax-depthmap", sourceDivs[i])[0];
			var originalLeft = getElementsByClass("javallax-left", sourceDivs[i])[0];
			var originalRight = getElementsByClass("javallax-right", sourceDivs[i])[0];
			
			if((typeof original == "object") && (typeof depthMap == "object")) {
				// there are an image and its depth map
				imageData[i]["MODE"] = ModeEnum.ORIG_DEPTH;
			}
			else if ((typeof originalLeft == "object") && (typeof originalRight == "object")) {
				// there is a stereo pair image pair
				imageData[i]["MODE"] = ModeEnum.LR;
				continue; // not yet supported!
			}
			else {
				// otherwise this div doesn't contain the appropriate image(s) for Javallax
				continue;
			}
			
			// start parallaxing process...
			
			imageData[i]["LOAD_STATUS"] = 0; // LOAD_STATUS is used to track how many source images has been loaded so far
			imageData[i]["CONTAINER"] = sourceDivs[i];
			imageData[i]["CONTAINER"].style.overflow = "hidden";
			
			var finalSize = getFinalContainerSize (i, hasOriginal(i) ? original : originalLeft);
			imageData[i]["CONTAINER"].style.width = finalSize.width + "px";
			imageData[i]["CONTAINER"].style.height = finalSize.height + "px";
			
			if (!isCanvasSupported()) {
				// bad news, this browser can't manage <canvas> elements
				var notSupported = document.createElement("div");
				
				// some style for the "not supported" message
				notSupported.style.width = "100%";
				notSupported.style.backgroundColor = "#E0E0E0";
				notSupported.style.textAlign = "center";
				notSupported.style.fontSize = "medium";
				notSupported.style.fontFamily = "Verdana";
				notSupported.style.color = "#000";
				notSupported.style.padding = "5px 0px 5px 0px";
				
				var txt = document.createTextNode("Your browser doesn't support Javallax, ");
				// and an useful link
				var link = document.createElement("a");
				link.target = "_blank";
				link.href = "http://www.updateyourbrowser.net";
				link.style.color = "#000";
				link.style.textDecoration = "underline";
				link.appendChild(document.createTextNode("update it!")); 
				
				notSupported.appendChild(txt); 
				notSupported.appendChild(link);
				
				// source image will still be in background
				imageData[i]["CONTAINER"].style.backgroundImage = "url(" + (hasOriginal(i) ? original.src : originalLeft.src) + ")";
				
				deleteChildren(imageData[i]["CONTAINER"]);
				imageData[i]["CONTAINER"].appendChild(notSupported);
				
				continue; // go to the next container
			}
			else {
				// get source images information and wait to be fully loaded
				if (hasOriginal(i)) {
					imageData[i]["ORIGINAL"] = new Image();
					imageData[i]["ORIGINAL"].id = i;
					imageData[i]["ORIGINAL"].src = original.src;
					imageData[i]["ORIGINAL"].onload = function(e) {
						loadCallback(this.id);
					};
					
					imageData[i]["DEPTHMAP"] = new Image();
					imageData[i]["DEPTHMAP"].id = i;
					imageData[i]["DEPTHMAP"].src = depthMap.src;
					imageData[i]["DEPTHMAP"].onload = function() {
						loadCallback(this.id);
					};
				}
				else {
					imageData[i]["LEFT"] = new Image();
					imageData[i]["LEFT"].id = i;
					imageData[i]["LEFT"].src = originalLeft.src;
					imageData[i]["LEFT"].onload = function() {
						loadCallback(this.id);
					};
					
					imageData[i]["RIGHT"] = new Image();
					imageData[i]["RIGHT"].id = i;
					imageData[i]["RIGHT"].src = originalRight.src;
					imageData[i]["RIGHT"].onload = function() {
						loadCallback(this.id);
					};
				}
			}
		}
		
		//var debugForm = document.getElementById("depth");
		//if (debugForm) debugForm.onchange = function() { changeDepth(this.value)};
	});
		
	function loadCallback (id) {
		if ( imageData[id]["LOAD_STATUS"] == (countImages(imageData[id]["CONTAINER"]) - 1) ) {
			// all the source images have been loaded, start to create the viewport
			drawViewport(id);
		}
		else {
			// one image has been loaded, more to come
			imageData[id]["LOAD_STATUS"]++;
		}
	}

	function drawViewport (id) {
		var viewPort = document.createElement("div");
		viewPort.style.position = "relative";
		viewPort.id = "javallax-viewport" + id;
		viewPort.className = "javallax-viewport";
		viewPort.style.width = imageData[id]["CONTAINER"].style.width;
		viewPort.style.height = imageData[id]["CONTAINER"].style.height;
		
		if (hasOriginal(id)) {
			imageData[id]["ORIGINAL"].width = parseInt(viewPort.style.width);
			imageData[id]["ORIGINAL"].height = parseInt(viewPort.style.height);
			imageData[id]["DEPTHMAP"].width = parseInt(viewPort.style.width);
			imageData[id]["DEPTHMAP"].height = parseInt(viewPort.style.height);
		}
		else {
			imageData[id]["LEFT"].width = parseInt(viewPort.style.width);
			imageData[id]["LEFT"].height = parseInt(viewPort.style.height);
			imageData[id]["RIGHT"].width = parseInt(viewPort.style.width);
			imageData[id]["RIGHT"].height = parseInt(viewPort.style.height);
		}
		
		imageData[id]["LAYERS"] = buildLayers(id);
		for (var l = 0; l < imageData[id]["LAYERS"].length; l++) {
			viewPort.appendChild(imageData[id]["LAYERS"][l]);
		}
		
		deleteChildren(imageData[id]["CONTAINER"]);
		imageData[id]["CONTAINER"].appendChild(viewPort);
		
		// when the cursors moves inside the viewport, the position of the viewer changes
		// (code stolen from http://coursesweb.net/javascript/get-mouse-coordinates-inside-div-image_s2)
		viewPort.onmousemove = function(e) {
			var x_pos, y_pos = 0;
			var x, y = 0;
			
			x_pos = this.offsetLeft;
			y_pos = this.offsetTop;
			var elm = this.offsetParent;
			
			while(elm != null) {
				x_pos = parseInt(x_pos) + parseInt(elm.offsetLeft);
				y_pos = parseInt(y_pos) + parseInt(elm.offsetTop);
				elm = elm.offsetParent;
			}
			
			if(navigator.appVersion.indexOf("MSIE") != -1) {
				// in IE scrolling page affects mouse coordinates into an element
				// This gets the page element that will be used to add scrolling value to correct mouse coords
				var standardBody = (document.compatMode == "CSS1Compat") ? document.documentElement : document.body;
				x = event.clientX + standardBody.scrollLeft;
				y = event.clientY + standardBody.scrollTop;
			}
			else {
				x = e.pageX;
				y = e.pageY;
			}
			
			x = x - x_pos;
			y = y - y_pos;
			
			changePointOfView(this, x, y);
		};
		
		if (!hasClass(imageData[id]["CONTAINER"], "javallax-noabout")) {
			// at last, add an about button on the top-right corner
			var aboutBtn = document.createElement("canvas");
			aboutBtn.className = "javallax-about";
			aboutBtn.style.position = "absolute";
			aboutBtn.style.top = "0px";
			aboutBtn.style.right = "0px";
			aboutBtn.style.zIndex = LAYERS_COUNT.toString();
			aboutBtn.style.cursor = "pointer";
			aboutBtn.style.opacity = 0.3;
			aboutBtn.width = aboutBtn.height = "30";
			
			var aboutBtnCtx = aboutBtn.getContext("2d");
			var centerX = aboutBtn.width / 2;
			var centerY = aboutBtn.height / 2;
			var radius = aboutBtn.width / 2 - 2;
			
			aboutBtnCtx.beginPath();
			aboutBtnCtx.arc(centerX, centerY, radius, 0, Math.PI*2, true); 
			aboutBtnCtx.closePath();
			aboutBtnCtx.fillStyle = "#DEDEDE";
			aboutBtnCtx.fill();
			aboutBtnCtx.lineWidth = 2;
			aboutBtnCtx.strokeStyle = "#000";
			aboutBtnCtx.stroke();
			aboutBtnCtx.fillStyle = "#000";
			aboutBtnCtx.textBaseline = "middle";
			aboutBtnCtx.font = "bold 20px monospace";
			aboutBtnCtx.fillText("J", centerX - 6, centerY);
			
			viewPort.appendChild(aboutBtn);
			
			aboutBtn.onmouseover = function() {
				this.style.opacity = 1.0;
			};
			aboutBtn.onmouseout = function() {
				this.style.opacity = 0.3;
			};
			aboutBtn.onclick = function() {
				showAbout();
			}
		}
	}
	
	function buildLayers (id) {
		var layers = [];
		var layersContexts = [];
		var layersData = [];
		
		if (hasOriginal(id)) {			
			// store final dimensions
			var totalWidth = imageData[id]["ORIGINAL"].width;
			var totalHeight = imageData[id]["ORIGINAL"].height;
			
			// get pixel informations from the original image and the depth map
			var originalData = buildImageData(imageData[id]["ORIGINAL"]).data;
			var depthData = buildImageData(imageData[id]["DEPTHMAP"]).data;
			var dataLen = depthData.length;
			
			// preparing layers
			for (var l = 0; l < LAYERS_COUNT; l++) {
				layers[l] = document.createElement("canvas"); // each layer is actually a canvas
				
				// some style and properties
				layers[l].width = totalWidth;
				layers[l].height = totalHeight;
				layers[l].id = "javallax-viewport" + id + "-layer" + l;
				layers[l].className = "javallax-layer";
				layers[l].style.position = "absolute";
				layers[l].style.top = "0px";
				layers[l].style.left = "0px";
				layers[l].style.zIndex = l.toString(); // layer 0 on lower level, LAYERS_COUNT-1 on top
				
				// store also contexts and data in a buffer
				layersContexts[l] = layers[l].getContext("2d");
				layersData[l] = layersContexts[l].getImageData(0, 0, totalWidth, totalHeight);
			}
			
			// loop on each pixel
			var prevLayerX, prevLayerY = -1;
			var COPY_X_COUNT = Math.round(LAYERS_COUNT * X_OFFSET);
			var COPY_Y_COUNT = Math.round(LAYERS_COUNT * Y_OFFSET);
			
			for (var y = 0; y < totalHeight; y++) {
				prevLayerX = -1;
				for (var x = 0; x < totalWidth; x++) {
					var pixIndex = getPixelIndex (x, y, totalWidth); // index of the current pixel
					
					// calc the proper layer to draw
					var layerIndex = getLayerIndex (depthData, pixIndex);
					
					// set the final pixel with informations from the original image
					layersData[layerIndex].data[pixIndex] = originalData[pixIndex]; // red
					layersData[layerIndex].data[pixIndex + 1] = originalData[pixIndex + 1]; // green
					layersData[layerIndex].data[pixIndex + 2] = originalData[pixIndex + 2]; // blue
					layersData[layerIndex].data[pixIndex + 3] = originalData[pixIndex + 3]; // alpha
					
					// now fill the covered areas that will be shown when the layers moves
					var copyDirection = 0;
					var coveredLayer;
					var pixToCopy;
					
					if (prevLayerX < layerIndex && prevLayerX > -1) {
						// case: previous layer was farther than this one, so it will be covered
						coveredLayer = prevLayerX;
						pixToCopy = getPixelIndex (x - 2, y, totalWidth); // take the previous pixel
						copyDirection = +1; // and copy it to the next COPY_COUNT pixels
					}
					else if (prevLayerX > layerIndex) {
						// case: previous layer was closer than this one, so this last will be covered
						coveredLayer = layerIndex;
						pixToCopy = pixIndex; // take the current pixel
						copyDirection = -1; // and copy it to the previous COPY_COUNT pixels
					}
					
					if (copyDirection != 0 && layersData[coveredLayer].data[pixToCopy + 3] > 0) {
						var copy = 0;
						var coveredPixel = getPixelIndex ((x + copy * copyDirection), y, totalWidth);
						
						while (copy < COPY_X_COUNT) {
							if (
							(copyDirection == 1 && getLayerIndex(depthData, coveredPixel) >= layerIndex) ||
							(copyDirection == -1 && getLayerIndex(depthData, coveredPixel) > layerIndex)
							) {
								layersData[coveredLayer].data[coveredPixel] = layersData[coveredLayer].data[pixToCopy];
								layersData[coveredLayer].data[coveredPixel + 1] = layersData[coveredLayer].data[pixToCopy + 1];
								layersData[coveredLayer].data[coveredPixel + 2] = layersData[coveredLayer].data[pixToCopy + 2];
								layersData[coveredLayer].data[coveredPixel + 3] = layersData[coveredLayer].data[pixToCopy + 3];
							}
							
							copy++;
							coveredPixel = getPixelIndex ((x + copy * copyDirection), y, totalWidth);
						}
					}
					
					
					if (prevLayerY < layerIndex && prevLayerY > -1) {
						coveredLayer = prevLayerY;
						pixToCopy = getPixelIndex (x, (y - 1), totalWidth);
						copyDirection = +1;
					}
					else if (prevLayerY > layerIndex) {
						coveredLayer = layerIndex;
						pixToCopy = pixIndex;
						copyDirection = -1;
					}
					
					if (copyDirection != 0 && layersData[coveredLayer].data[pixToCopy + 3] > 0) {
						var copy = 0;
						var coveredPixel = getPixelIndex (x, (y + (copy * copyDirection)), totalWidth);
						
						while (copy < COPY_Y_COUNT) {
							if (
							(copyDirection == 1 && getLayerIndex(depthData, coveredPixel) >= layerIndex) ||
							(copyDirection == -1 && getLayerIndex(depthData, coveredPixel) > layerIndex)
							) {
								layersData[coveredLayer].data[coveredPixel] = layersData[coveredLayer].data[pixToCopy];
								layersData[coveredLayer].data[coveredPixel + 1] = layersData[coveredLayer].data[pixToCopy + 1];
								layersData[coveredLayer].data[coveredPixel + 2] = layersData[coveredLayer].data[pixToCopy + 2];
								layersData[coveredLayer].data[coveredPixel + 3] = layersData[coveredLayer].data[pixToCopy + 3];
							}
							
							copy++;
							coveredPixel = getPixelIndex (x, (y + (copy * copyDirection)), totalWidth);
						}
					}
					
					prevLayerX = layerIndex;
					if (y > 0) prevLayerY = getLayerIndex(depthData, getPixelIndex (x, (y - 1), totalWidth));
				}
			}
		}
		
		// apply the new data to all the contexts
		for (var l = 0; l < LAYERS_COUNT; l++) {
			layersContexts[l].putImageData(layersData[l], 0, 0);
		}
		
		return layers;
	}
	
	// parse depth level using classic average, it goes from 0 (far) to 255 (near)
	// closer layers (with depth value around 255) have index around 0
	// furthermost layers (with depth value around 0) have index around LAYERS_COUNT-1
	function getLayerIndex (depthData, pixel) {
		var depthLevel = Math.round((
			depthData[pixel] + 
			depthData[pixel + 1] + 
			depthData[pixel + 2]
		) / 3);
		
		return Math.floor((LAYERS_COUNT / 256) * depthLevel);
	}
	
	function getPixelIndex (x, y, totalWidth) {
		return (y * totalWidth + x) * 4;
	}

	function changePointOfView (viewPort, x, y) {
		var wHalf = parseInt(viewPort.style.width) / 2;
		var hHalf = parseInt(viewPort.style.height) / 2;
		
		var wPercent = Math.round((x < wHalf) ? 100 - (100 / wHalf * x) : -((100 / wHalf * x) - 100));
		var hPercent = Math.round((y < hHalf) ? 100 - (100 / hHalf * y) : -((100 / hHalf * y) - 100));
		
		var layers = getElementsByClass("javallax-layer", viewPort);
		for (var i = 0; i < LAYERS_COUNT; i++) {
			var zIndex = parseInt(layers[i].style.zIndex);
			layers[i].style.left = ((X_OFFSET * wPercent / 100) * (zIndex + 1)) + "px";
			layers[i].style.top = ((Y_OFFSET * hPercent / 100) * (zIndex + 1)) + "px";
		}
	}
	
	function showAbout() {		
	
		var docElem = (document.compatMode === "CSS1Compat") ? 
			document.documentElement :
			document.body;
		
		var overlay = document.createElement("div");
		overlay.id = "javallax-overlay";
		overlay.style.backgroundColor = "#000";
		overlay.style.opacity = 0.7;
		overlay.style.position = "absolute";
		overlay.style.top = docElem.scrollTop + "px";
		overlay.style.left = "0px";
		overlay.style.zIndex = "9998";
		overlay.onclick = function () {
			hideAbout();
		}
		
		overlay.style.height = parseInt(docElem.clientHeight) + "px";
		overlay.style.width = parseInt(docElem.clientWidth) + "px";
		
		document.body.appendChild(overlay);
		
		var about = document.createElement("div");
		about.id = "javallax-about";
		about.style.backgroundColor = "#fff";
		about.style.position = "absolute";
		about.style.width = "360px";
		about.style.height = "120px";
		about.style.padding = "15px";
		about.style.zIndex = "9999";
		about.style.top = (parseInt(docElem.scrollTop) + parseInt(docElem.clientHeight) / 2 - 100) + "px";		
		about.style.left = (parseInt(docElem.clientWidth) / 2 - 180) + "px";	
		about.style.textAlign = "center";
		about.style.fontFamily = "Verdana";
		about.style.fontSize = "13px";
		about.style.color = "#000";
		
		var logo = document.createElement("div");
		logo.style.color = "#2D4F85";
		logo.style.fontFamily = "Monospace";
		logo.style.fontWeight = "bold";
		var nameString = "JAVALLAX";
		for (var i = 0; i < nameString.length; i++ ) {
			var letter = document.createElement("span");
			if (i < nameString.length / 2) {
				letter.style.fontSize = (22 + i*4) + "px";
			}
			else {
				letter.style.fontSize = (34 - (i-3)*4) + "px";
			}
			letter.appendChild(document.createTextNode(nameString[i]));
			logo.appendChild(letter);
		}
		about.appendChild(logo);
		
		var payoff = document.createElement("div");
		payoff.style.fontWeight = "bold";
		payoff.style.paddingBottom = "10px";
		payoff.appendChild(document.createTextNode("Enables a 3D/parallax effect on web images"));
		about.appendChild(payoff);
		
		var version = document.createElement("div");
		version.style.paddingBottom = "10px";
		version.appendChild(document.createTextNode("Version " + JAVALLAX_VERSION));
		about.appendChild(version);
		
		var author = document.createElement("div");
		author.appendChild(document.createTextNode("Created by "));
		
		var link = document.createElement("a");
		link.target = "_blank";
		link.href = "http://www.alessandrofrancesconi.it/projects/javallax";
		link.style.color = "#000";
		link.style.textDecoration = "underline";
		link.appendChild(document.createTextNode("Alessandro Francesconi")); 		
		author.appendChild(link);
		
		about.appendChild(author);
		
		document.body.appendChild(about);
		
		document.body.style.overflow = "hidden";
	}
	
	function hideAbout() {
		var about = document.getElementById("javallax-about");
		var overlay = document.getElementById("javallax-overlay");
		if (about != undefined) document.body.removeChild(about);
		if (overlay != undefined) document.body.removeChild(overlay);
		
		document.body.style.overflow = "auto";
	}
	
	/* Following: two simple wrappers for a "better name" purpose*/
	
	function hasOriginal (id) {
		return (imageData[id]["MODE"] == ModeEnum.ORIG_DEPTH);
	}
	
	function hasLeftRight (id) {
		return (imageData[id]["MODE"] == ModeEnum.LR);
	}
	
	/* Counts images elements in the given container */
	function countImages (container) {
		return container.getElementsByTagName("img").length;
	}
	
	/* Deletes all children in the given container */
	function deleteChildren (container) {
		if (container.hasChildNodes() ) {
			while (container.childNodes.length > 0 ) {
				container.removeChild(container.firstChild );       
			}
		}
	}
	
	function getFinalContainerSize (id, sourceImg) {
		var size = [];
		
		size["width"] = parseInt(
			(imageData[id]["CONTAINER"].style.width != "") ? 
				imageData[id]["CONTAINER"].style.width :
				sourceImg.width
			);
		
		size["height"] = parseInt(
			(imageData[id]["CONTAINER"].style.height != "") ? 
				(imageData[id]["CONTAINER"].style.height) :
				sourceImg.height
			);
				
		return size;
	}
	
	/* Simply returns an ImageData object from the given Image element 
	 * by creating a temp canvas on it */
	function buildImageData (imgElem) {
		var temp = document.createElement("canvas");
		var tempContext = temp.getContext("2d");
		
		temp.width = imgElem.width;
		temp.height = imgElem.height;
		tempContext.drawImage(imgElem, 0, 0);
		
		return tempContext.getImageData(0, 0, temp.width, temp.height);
	}
	
	/* returns TRUE if the browser supports Canvas element */
	function isCanvasSupported () {
		var test = document.createElement("canvas");
		return !!(test.getContext && test.getContext("2d"));
	}

	/* Gets all elements with the given classname (from http://www.dustindiaz.com/getelementsbyclass)*/
	function getElementsByClass(searchClass, node, tag) {
		var classElements = new Array();
		if ( node == null )
		node = document;
		if ( tag == null )
		tag = '*';
		var els = node.getElementsByTagName(tag);
		var elsLen = els.length;
		var pattern = new RegExp("(^|\\s)"+searchClass+"(\\s|$)");
		for (i = 0, j = 0; i < elsLen; i++) {
			if ( pattern.test(els[i].className) ) {
				classElements[j] = els[i];
				j++;
			}
		}
		return classElements;
	}
	
	/* Returns true is element has the given class */
	function hasClass(element, cls) {
		return element.className.match(new RegExp("(\\s|^)"+cls+"(\\s|$)"));
	}

	function addLoadEvent (func) {
		var oldOnEvents = window.onload;
		if (typeof window.onload != "function") {
			window.onload = func;
		} else {
			window.onload = function() {
				oldOnEvents();
				func();
			}
		}
	}
	
	/* only for debug */
	function changeDepth(d) {
		var divs = getElementsByClass("javallax");
		for (var i = 0; i < divs.length; i++) {
			var layers = getElementsByClass("javallax-layer", divs[i]);
			for (var j = 0; j < layers.length; j++) {
				if (parseInt(layers[j].style.zIndex) > d)
					layers[j].style.display = "none";
				else layers[j].style.display = "block";
			}
		}
	}

})();