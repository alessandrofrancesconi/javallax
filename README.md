Javallax
========

Javallax is a Javascript library that enables a 3D/parallax effect on web images.

In plain words, it can simulate the effect as you move the mouse over an image like this 
https://github.com/javallax_can_do_that (yeah, the GitHub's 404 error effect) without creating 
layers and without needing to know HTML5 stuff.

Demo here: http://www.alessandrofrancesconi.it/projects/javallax

Requirements and usage
----------------------

Javallax works on browsers that supports "canvas" element: IE9+, Firefox 15+, Chrome 22+, Safari 5.1+, Opera 12.1+, Safari 3.2+

The two things you need are __an image and its relative [depth map](http://goo.gl/aBwCE)__. 

Include `javallax.js` in your web page, then add an element with class `javallax` where you want to put
the image. Insert inside this element the original image with class `javallax-original` and the 
depth map with class `javallax-depthmap`.

For example:

```no-highlight
<html>
  <head>
    <script type="text/javascript" src="javallax.js"></script>
  </head>
  
  <body>
    <div class="javallax">
      <img class="javallax-original" src="image_ORIG.jpg" />
      <img class="javallax-depthmap" src="image_DEPTH.jpg" />
	</div>
  </body>
</html>
```

Future improvements
--------------------

* Extend the support to [stereo images](http://goo.gl/tyiun)
* Optimize code and loading speed
