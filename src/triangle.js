let Triangle;

(function() {
    "use strict";

    var EPSILON = 1.0 / 1048576.0;

    function supertriangle(vertices) {
        var xmin = Number.POSITIVE_INFINITY,
            ymin = Number.POSITIVE_INFINITY,
            xmax = Number.NEGATIVE_INFINITY,
            ymax = Number.NEGATIVE_INFINITY,
            i, dx, dy, dmax, xmid, ymid;

        for (i = vertices.length; i--;) {
            if (vertices[i][0] < xmin) xmin = vertices[i][0];
            if (vertices[i][0] > xmax) xmax = vertices[i][0];
            if (vertices[i][1] < ymin) ymin = vertices[i][1];
            if (vertices[i][1] > ymax) ymax = vertices[i][1];
        }

        dx = xmax - xmin;
        dy = ymax - ymin;
        dmax = Math.max(dx, dy);
        xmid = xmin + dx * 0.5;
        ymid = ymin + dy * 0.5;

        return [
            [xmid - 20 * dmax, ymid - dmax],
            [xmid, ymid + 20 * dmax],
            [xmid + 20 * dmax, ymid - dmax]
        ];
    }

    function circumcircle(vertices, i, j, k) {
        var x1 = vertices[i][0],
            y1 = vertices[i][1],
            x2 = vertices[j][0],
            y2 = vertices[j][1],
            x3 = vertices[k][0],
            y3 = vertices[k][1],
            fabsy1y2 = Math.abs(y1 - y2),
            fabsy2y3 = Math.abs(y2 - y3),
            xc, yc, m1, m2, mx1, mx2, my1, my2, dx, dy;

        /* Check for coincident points */
        if (fabsy1y2 < EPSILON && fabsy2y3 < EPSILON)
            throw new Error("Eek! Coincident points!");

        if (fabsy1y2 < EPSILON) {
            m2 = -((x3 - x2) / (y3 - y2));
            mx2 = (x2 + x3) / 2.0;
            my2 = (y2 + y3) / 2.0;
            xc = (x2 + x1) / 2.0;
            yc = m2 * (xc - mx2) + my2;
        } else if (fabsy2y3 < EPSILON) {
            m1 = -((x2 - x1) / (y2 - y1));
            mx1 = (x1 + x2) / 2.0;
            my1 = (y1 + y2) / 2.0;
            xc = (x3 + x2) / 2.0;
            yc = m1 * (xc - mx1) + my1;
        } else {
            m1 = -((x2 - x1) / (y2 - y1));
            m2 = -((x3 - x2) / (y3 - y2));
            mx1 = (x1 + x2) / 2.0;
            mx2 = (x2 + x3) / 2.0;
            my1 = (y1 + y2) / 2.0;
            my2 = (y2 + y3) / 2.0;
            xc = (m1 * mx1 - m2 * mx2 + my2 - my1) / (m1 - m2);
            yc = (fabsy1y2 > fabsy2y3) ?
                m1 * (xc - mx1) + my1 :
                m2 * (xc - mx2) + my2;
        }

        dx = x2 - xc;
        dy = y2 - yc;
        return { i: i, j: j, k: k, x: xc, y: yc, r: dx * dx + dy * dy };
    }

    function dedup(edges) {
        var i, j, a, b, m, n;

        for (j = edges.length; j;) {
            b = edges[--j];
            a = edges[--j];

            for (i = j; i;) {
                n = edges[--i];
                m = edges[--i];

                if ((a === m && b === n) || (a === n && b === m)) {
                    edges.splice(j, 2);
                    edges.splice(i, 2);
                    break;
                }
            }
        }
    }

    function triangulate(vertices, key) {
        var n = vertices.length,
            i, j, indices, st, open, closed, edges, dx, dy, a, b, c;

        /* Bail if there aren't enough vertices to form any triangles. */
        if (n < 3)
            return [];

        /* Slice out the actual vertices from the passed objects. (Duplicate the
         * array even if we don't, though, since we need to make a supertriangle
         * later on!) */
        vertices = vertices.slice(0);

        if (key)
            for (i = n; i--;)
                vertices[i] = vertices[i][key];

        /* Make an array of indices into the vertex array, sorted by the
         * vertices' x-position. Force stable sorting by comparing indices if
         * the x-positions are equal. */
        indices = new Array(n);

        for (i = n; i--;)
            indices[i] = i;

        indices.sort(function(i, j) {
            var diff = vertices[j][0] - vertices[i][0];
            return diff !== 0 ? diff : i - j;
        });

        /* Next, find the vertices of the supertriangle (which contains all other
         * triangles), and append them onto the end of a (copy of) the vertex
         * array. */
        st = supertriangle(vertices);
        vertices.push(st[0], st[1], st[2]);

        /* Initialize the open list (containing the supertriangle and nothing
         * else) and the closed list (which is empty since we havn't processed
         * any triangles yet). */
        open = [circumcircle(vertices, n + 0, n + 1, n + 2)];
        closed = [];
        edges = [];

        /* Incrementally add each vertex to the mesh. */
        for (i = indices.length; i--; edges.length = 0) {
            c = indices[i];

            /* For each open triangle, check to see if the current point is
             * inside it's circumcircle. If it is, remove the triangle and add
             * it's edges to an edge list. */
            for (j = open.length; j--;) {
                /* If this point is to the right of this triangle's circumcircle,
                 * then this triangle should never get checked again. Remove it
                 * from the open list, add it to the closed list, and skip. */
                dx = vertices[c][0] - open[j].x;
                if (dx > 0.0 && dx * dx > open[j].r) {
                    closed.push(open[j]);
                    open.splice(j, 1);
                    continue;
                }

                /* If we're outside the circumcircle, skip this triangle. */
                dy = vertices[c][1] - open[j].y;
                if (dx * dx + dy * dy - open[j].r > EPSILON)
                    continue;

                /* Remove the triangle and add it's edges to the edge list. */
                edges.push(
                    open[j].i, open[j].j,
                    open[j].j, open[j].k,
                    open[j].k, open[j].i
                );
                open.splice(j, 1);
            }

            /* Remove any doubled edges. */
            dedup(edges);

            /* Add a new triangle for each edge. */
            for (j = edges.length; j;) {
                b = edges[--j];
                a = edges[--j];
                open.push(circumcircle(vertices, a, b, c));
            }
        }

        /* Copy any remaining open triangles to the closed list, and then
         * remove any triangles that share a vertex with the supertriangle,
         * building a list of triplets that represent triangles. */
        for (i = open.length; i--;)
            closed.push(open[i]);
        open.length = 0;

        for (i = closed.length; i--;)
            if (closed[i].i < n && closed[i].j < n && closed[i].k < n)
                open.push(closed[i].i, closed[i].j, closed[i].k);

            /* Yay, we're done! */
        return open;
    }

    function contains(tri, p) {
        /* Bounding box test first, for quick rejections. */
        if ((p[0] < tri[0][0] && p[0] < tri[1][0] && p[0] < tri[2][0]) ||
            (p[0] > tri[0][0] && p[0] > tri[1][0] && p[0] > tri[2][0]) ||
            (p[1] < tri[0][1] && p[1] < tri[1][1] && p[1] < tri[2][1]) ||
            (p[1] > tri[0][1] && p[1] > tri[1][1] && p[1] > tri[2][1]))
            return null;

        var a = tri[1][0] - tri[0][0],
            b = tri[2][0] - tri[0][0],
            c = tri[1][1] - tri[0][1],
            d = tri[2][1] - tri[0][1],
            i = a * d - b * c;

        /* Degenerate tri. */
        if (i === 0.0)
            return null;

        var u = (d * (p[0] - tri[0][0]) - b * (p[1] - tri[0][1])) / i,
            v = (a * (p[1] - tri[0][1]) - c * (p[0] - tri[0][0])) / i;

        /* If we're outside the tri, fail. */
        if (u < 0.0 || v < 0.0 || (u + v) > 1.0)
            return null;

        return [u, v];
    }

    Triangle = {
        create: function(canvas, options = {}) {

            let numPoints = "numPoints" in options ? options.numPoints : 300;
            let frameRate = "frameRate" in options ? options.frameRate : 60;
            let velocity = "velocity" in options ? options.velocity : 0.5;
            let fillStyle = "fillStyle" in options ? options.fillStyle : function(x, y) {
                return `rgb(${y * 100},${y * 200},${255})`;
            };

            let ctx = canvas.getContext("2d"),
                vertices = new Array(numPoints + 4),
                velocities = new Array(numPoints + 4),
                i, x, y,
                expandedWidth, expandedHeight,
                expandedOffsetX, expandedOffsetY;


            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;

            expandedWidth = canvas.width * 1.1;
            expandedHeight = canvas.height * 1.1;
            expandedOffsetX = (canvas.width - expandedWidth) / 2;
            expandedOffsetY = (canvas.height - expandedHeight) / 2;

            var doCheck = true;

            function check() {
                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;

                expandedWidth = canvas.width * 1.1;
                expandedHeight = canvas.height * 1.1;
                expandedOffsetX = (canvas.width - expandedWidth) / 2;
                expandedOffsetY = (canvas.height - expandedHeight) / 2;

                for (i = 4; i < vertices.length; i++) {
                    vertices[i] = [Math.random() * expandedWidth, Math.random() * expandedHeight];
                    velocities[i] = [(Math.random() - 0.5) * velocity, (Math.random() - 0.5) * velocity];
                }
            };

            window.addEventListener("resize", function() {
                if (doCheck) {
                    check();
                    doCheck = false;
                    setTimeout(function() {
                        doCheck = true;
                        check();
                    }, 500)
                }
            });

            vertices[0] = [0, 0];
            velocities[0] = [0, 0];
            vertices[1] = [expandedWidth - 1, 0];
            velocities[1] = [0, 0];
            vertices[2] = [expandedWidth - 1, expandedHeight - 1];
            velocities[2] = [0, 0];
            vertices[3] = [0, expandedHeight - 1];
            velocities[3] = [0, 0];

            for (i = 4; i < vertices.length; i++) {
                vertices[i] = [Math.random() * expandedWidth, Math.random() * expandedHeight];
                velocities[i] = [(Math.random() - 0.5) * velocity, (Math.random() - 0.5) * velocity];
            }

            setInterval(animate, 1 / frameRate);

            function animate() {

                for (i = vertices.length; i--;) {
                    vertices[i][0] = (vertices[i][0] + velocities[i][0] + expandedWidth) % expandedWidth;
                    vertices[i][1] = (vertices[i][1] + velocities[i][1] + expandedHeight) % expandedHeight;
                }

                //console.time("triangulate");
                var triangles = triangulate(vertices);
                //console.timeEnd("triangulate");

                //ctx.fillStyle = `rgb(255,255,255,0.01)`;
                //ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                for (i = triangles.length; i;) {
                    ctx.beginPath();
                    --i;

                    x = ((vertices[triangles[i]][0] + vertices[triangles[i - 1]][0] + vertices[triangles[i - 2]][0]) / 3 + expandedOffsetX) / canvas.width;
                    y = ((vertices[triangles[i]][1] + vertices[triangles[i - 1]][1] + vertices[triangles[i - 2]][1]) / 3 + expandedOffsetY) / canvas.height;

                    ctx.fillStyle = fillStyle(x, y);
                    ctx.strokeStyle = ctx.fillStyle;
                    ctx.moveTo(vertices[triangles[i]][0] + expandedOffsetX, vertices[triangles[i]][1] + expandedOffsetY);
                    --i;
                    ctx.lineTo(vertices[triangles[i]][0] + expandedOffsetX, vertices[triangles[i]][1] + expandedOffsetY);
                    --i;
                    ctx.lineTo(vertices[triangles[i]][0] + expandedOffsetX, vertices[triangles[i]][1] + expandedOffsetY);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }
            }
        }
    };

    if (typeof module !== "undefined")
        module.exports = Triangle;
})();