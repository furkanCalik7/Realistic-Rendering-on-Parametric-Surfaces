var canvas;
var gl;

var pointsArray = [];
var colorsArray = [];
// Two dimensional array
const GRID_SIZE = 200;
var SHRINK_VALUE = 10;
var grid = [];

var vertexColors = [
  vec4(0.0, 0.0, 0.0, 1.0), // black
  vec4(1.0, 0.0, 0.0, 1.0), // red
  vec4(1.0, 1.0, 0.0, 1.0), // yellow
  vec4(0.0, 1.0, 0.0, 1.0), // green
  vec4(0.0, 0.0, 1.0, 1.0), // blue
  vec4(1.0, 0.0, 1.0, 1.0), // magenta
  vec4(0.0, 1.0, 1.0, 1.0), // cyan
  vec4(1.0, 1.0, 1.0, 1.0), // white
];

constructGrid();
function constructTriangles() {
  for (var u = 0; u < GRID_SIZE - 1; u++) {
    for (var v = 0; v < GRID_SIZE - 1; v++) {
      Quad(u, v);
    }
  }
}
constructTriangles();

var near = -1;
var far = 1;
var radius = 1.0;
var theta = 0.0;
var phi = 0.0;
var dr = (5.0 * Math.PI) / 180.0;

var left = -1.0;
var right = 1.0;
var ytop = 1.0;
var bottom = -1.0;

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;
var eye;

const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

window.onload = function init() {
  const canvas = document.createElement("canvas");
  canvas.height = 1000;
  canvas.width = 1000;
  $("#canvas").append(canvas);
  $("#canvas").css("cursor", "none");
  gl = canvas.getContext("webgl");
  if (!gl) {
    alert("WebGL isn't available");
  }

  gl.viewport(0, 0, canvas.width, canvas.height);

  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  gl.enable(gl.DEPTH_TEST);

  //
  //  Load shaders and initialize attribute buffers
  //
  var program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  var cBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(colorsArray), gl.STATIC_DRAW);

  var vColor = gl.getAttribLocation(program, "vColor");
  gl.vertexAttribPointer(vColor, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vColor);

  var vBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

  var vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);

  modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
  projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

  adjustCameraParam();
  render();
};

var render = function () {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  eye = vec3(
    radius * Math.sin(phi),
    radius * Math.sin(theta),
    radius * Math.cos(phi)
  );

  modelViewMatrix = lookAt(eye, at, up);
  projectionMatrix = ortho(left, right, bottom, ytop, near, far);

  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
  gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
  //console.log(pointsArray);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, GRID_SIZE * GRID_SIZE * 4);
  requestAnimFrame(render);
};

function adjustCameraParam() {
  document.getElementById("Button1").onclick = function () {
    near *= 1.1;
    far *= 1.1;
  };
  document.getElementById("Button2").onclick = function () {
    near *= 0.9;
    far *= 0.9;
  };
  document.getElementById("Button3").onclick = function () {
    radius *= 1.1;
  };
  document.getElementById("Button4").onclick = function () {
    radius *= 0.9;
  };
  document.getElementById("Button5").onclick = function () {
    theta += dr;
  };
  document.getElementById("Button6").onclick = function () {
    theta -= dr;
  };
  document.getElementById("Button7").onclick = function () {
    phi += dr;
  };
  document.getElementById("Button8").onclick = function () {
    phi -= dr;
  };
}

function constructGrid() {
  for (var i = 0; i < GRID_SIZE; i++) {
    var u = ((2 * Math.PI + (2 * Math.PI) / GRID_SIZE) / GRID_SIZE) * i;
    grid[i] = [];
    for (var k = 0; k < GRID_SIZE; k++) {
      var v = ((2 * Math.PI + (2 * Math.PI) / GRID_SIZE) / GRID_SIZE) * k;
      grid[i][k] = {
        u: u,
        v: v,
      };
    }
  }
}

function getVertexFromparameterizedFunction(u, v) {
  var u1 = grid[u][v].u;
  var v1 = grid[u][v].v;
  var x =
    4 *
      Math.cos(2 * u1) *
      (1 + 0.6 * (Math.cos(5 * u1) + 0.75 * Math.cos(10 * u1))) +
    Math.cos(v1) *
      Math.cos(2 * u1) *
      (1 + 0.6 * (Math.cos(5 * u1) + 0.75 * Math.cos(10 * u1)));
  var y =
    4 *
      Math.sin(2 * u1) *
      (1 + 0.6 * (Math.cos(5 * u1) + 0.75 * Math.cos(10 * u1))) +
    Math.cos(v1) *
      Math.sin(2 * u1) *
      (1 + 0.6 * (Math.cos(5 * u1) + 0.75 * Math.cos(10 * u1)));
  var z = Math.sin(v1) + 0.35 * Math.sin(5 * u1);

  // var x =
  //   4 *
  //     Math.cos(3 * u1) *
  //     (1 + 0.6 * (Math.cos(5 * u1) + 0.75 * Math.cos(15 * u1))) +
  //   Math.cos(v1) *
  //     Math.cos(3 * u1) *
  //     (1 + 0.6 * (Math.cos(5 * u1) + 0.75 * Math.cos(15 * u1)));
  // var y =
  //   4 *
  //     Math.sin(3 * u1) *
  //     (1 + 0.6 * (Math.cos(5 * u1) + 0.75 * Math.cos(15 * u1))) +
  //   Math.cos(v1) *
  //     Math.sin(3 * u1) *
  //     (1 + 0.6 * (Math.cos(5 * u1) + 0.75 * Math.cos(15 * u1)));
  // var z = Math.sin(v1) + 0.35 * Math.sin(10 * u1);

  return {
    x: x / SHRINK_VALUE,
    y: y / SHRINK_VALUE,
    z: z / SHRINK_VALUE,
  };
}

function Quad(u, v) {
  var a = getVertexFromparameterizedFunction(u, v);
  var b = getVertexFromparameterizedFunction(u + 1, v);
  var c = getVertexFromparameterizedFunction(u, v + 1);
  var d = getVertexFromparameterizedFunction(u + 1, v + 1);

  pointsArray.push(vec4(a.x, a.y, a.z, 1));
  colorsArray.push(vertexColors[4]);
  pointsArray.push(vec4(b.x, b.y, b.z, 1));
  colorsArray.push(vertexColors[4]);
  pointsArray.push(vec4(c.x, c.y, c.z, 1));
  colorsArray.push(vertexColors[4]);
  // pointsArray.push(vec4(b.x, b.y, b.z, 1));
  // colorsArray.push(vertexColors[2]);
  // pointsArray.push(vec4(c.x, c.y, c.z, 1));
  // colorsArray.push(vertexColors[2]);
  pointsArray.push(vec4(d.x, d.y, d.z, 1));
  colorsArray.push(vertexColors[2]);
}
