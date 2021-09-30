# triangles-js
##### A JavaScript module that renders cool animated triangle patterns.

This module creates Delaunay Triangles very fast with a modified version of [ironwallaby's](https://github.com/darkskyapp/delaunay-fast) implementation. It resizes to fit the canvas that it draws on, so any sized canvas can use triangles-js.

[DEMO HERE](https://raw.githack.com/ao-shen/triangle-js/main/demo/index.html)


### 1. Default Pattern
![Demo0](https://github.com/ao-shen/triangle-js/raw/main/images/demo0.gif)

This is the default pattern. How boring!!!

```html
<canvas id="canvas0"></canvas>
<script type="text/javascript" src="../src/triangle.js"></script>
<script type="text/javascript">
    Triangle.create(document.getElementById("canvas0"));
</script>
```

### 2. Custom Pattern
![Demo1](https://github.com/ao-shen/triangle-js/raw/main/images/demo1.gif)

This is a custom pattern. The number of points can be customized! The velocity of the points can be customized! Even the color of each triangle can be customized with a function!

```html
<canvas id="canvas1"></canvas>
<script type="text/javascript" src="../src/triangle.js"></script>
<script type="text/javascript">
    Triangle.create(document.getElementById("canvas1"), {
        numPoints: 75,
        velocity: 0.25,
        fillStyle: function(x, y) {
            return `rgb(${y * 255},${x * 255},${255})`;
        },
    });
</script>
```

### 3. Rainbow Pattern
![Demo2](https://github.com/ao-shen/triangle-js/raw/main/images/demo2.gif)

This is a rainbow pattern. The fillStyle function is converting HSL color into rgb format for a rainbow effect!

```html
<canvas id="canvas2"></canvas>
<script type="text/javascript" src="../src/triangle.js"></script>
<script type="text/javascript">
    Triangle.create(document.getElementById("canvas2"), {
        numPoints: 600,
        frameRate: 60,
        velocity: 1,
        fillStyle: function(x, y) {
            let h = x,
                s = 0.8,
                l = y * 0.6 + 0.2;
            var r, g, b;

            if (s == 0) {
                r = g = b = l; // achromatic
            } else {
                var hue2rgb = function hue2rgb(p, q, t) {
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1 / 6) return p + (q - p) * 6 * t;
                    if (t < 1 / 2) return q;
                    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                    return p;
                }

                var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                var p = 2 * l - q;
                r = hue2rgb(p, q, h + 1 / 3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1 / 3);
            }

            return `rgb(${r*255},${g*255},${b*255})`;
        },
    });
</script>
```

### 4. Complex Functions Pattern
![Demo3](https://github.com/ao-shen/triangle-js/raw/main/images/demo3.gif)

This is a striped pattern created with a cosine function in the horizontal direction. You can use any function you want to create any pattern that you can think of!

```html
<canvas id="canvas3"></canvas>
<script type="text/javascript" src="../src/triangle.js"></script>
<script type="text/javascript">
    Triangle.create(document.getElementById("canvas3"), {
        numPoints: 150,
        frameRate: 60,
        velocity: 2,
        fillStyle: function(x, y) {
            return `rgb(${(Math.cos(x*4*Math.PI)+1)* 255*0.5},${155 + y * 100},${y * 100})`;
        },
    });
</script>
```

## Documentation
##### Triangle.create(canvas, options)
Parameter | Description
------------ | -------------
canvas | The canvas element to draw triangles on
options.numPoints: Int | (optional) Number of points to use to make triangles
options.frameRate: Int | (optional) The framerate to use to render triangles.
options.velocity: Float | (optional) The maximum velocity of points
options.fillStyle: (x: Float, y: Float) => String | (optional) The function that calculates the color of each triangle. It takes in the X and Y coordinates and returns a string containing the rgb color of the triangle whose centroid is at position (X, Y). The range for x and y is 0 to 1.
