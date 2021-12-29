var canvas;
var gl;
var program;
var texture;

var pointsArray = [];
var colorsArray = [];
var textArray = [];
var normalsArray = [];
// Two dimensional array
const GRID_SIZE = 150;
var SHRINK_VALUE = 10;
var grid = [];

// SHADER MODE

const SIMPLE_MODE = 0;
const WIREFRAME_MODE = 1;
const GOURAUD_MODE = 2;
const PHONG_MODE = 3;
// Adjust the mode to the desired mode
var mode = PHONG_MODE;
// Dont touch this one
var fmode = mode;

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
constructTriangles();

var lightPosition = vec4(1.0, 1.0, 1.0, 0.0);
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
var lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
var lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

var materialAmbient = vec4(1.0, 0.0, 1.0, 1.0);
var materialDiffuse = vec4(1.0, 0.8, 0.0, 1.0);
var materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
var materialShininess = 20.0;

var ambientColor, diffuseColor, specularColor;
var normalMatrix, normalMatrixLoc;

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
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);

  ambientProduct = mult(lightAmbient, materialAmbient);
  diffuseProduct = mult(lightDiffuse, materialDiffuse);
  specularProduct = mult(lightSpecular, materialSpecular);

  var nBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

  var vNormal = gl.getAttribLocation(program, "vNormal");
  gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vNormal);

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

  var tBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(textArray), gl.STATIC_DRAW);
  var vTexCoord = gl.getAttribLocation(program, "vTexCoord");
  gl.vertexAttribPointer(vTexCoord, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vTexCoord);

  configureTexture();

  modelViewMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
  projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
  normalMatrixLoc = gl.getUniformLocation(program, "normalMatrix");

  gl.uniform4fv(
    gl.getUniformLocation(program, "ambientProduct"),
    flatten(ambientProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "diffuseProduct"),
    flatten(diffuseProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "specularProduct"),
    flatten(specularProduct)
  );
  gl.uniform4fv(
    gl.getUniformLocation(program, "lightPosition"),
    flatten(lightPosition)
  );
  gl.uniform1f(gl.getUniformLocation(program, "shininess"), materialShininess);

  adjustCameraParam();
  render();
};

var render = function () {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  gl.uniform1i(gl.getUniformLocation(program, "mode"), mode);
  gl.uniform1i(gl.getUniformLocation(program, "fmode"), fmode);
  eye = vec3(
    radius * Math.sin(phi),
    radius * Math.sin(theta),
    radius * Math.cos(phi)
  );

  // eye = vec3(
  //   radius * Math.sin(theta) * Math.cos(phi),
  //   radius * Math.sin(theta) * Math.sin(phi),
  //   radius * Math.cos(theta)
  // );

  modelViewMatrix = lookAt(eye, at, up);
  projectionMatrix = ortho(left, right, bottom, ytop, near, far);

  normalMatrix = [
    vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
    vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
    vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2]),
  ];

  gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
  gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
  gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix));
  gl.drawArrays(gl.TRIANGLES, 0, GRID_SIZE * GRID_SIZE * 6);
  requestAnimFrame(render);
};

function adjustCameraParam() {
  document.getElementById("Button1").onclick = function () {
    near *= 1.1;
    far *= 1.1;
    mode = SIMPLE_MODE;
    fmode = mode;
  };
  document.getElementById("Button2").onclick = function () {
    near *= 0.9;
    far *= 0.9;
    mode = PHONG_MODE;
    fmode = mode;
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

  // var x = (3 + Math.cos(v1)) * Math.cos(u1);
  // var y = (3 + Math.cos(v1)) * Math.sin(u1);
  // var z = Math.sin(v1);

  // var nx = Math.cos(u1) * Math.cos(v1);
  // var ny = Math.sin(u1) * Math.cos(v1);
  // var nz = Math.sin(v1);

  var nxu =
    4 *
      (-2 *
        Math.sin(2 * u) *
        (1 + 0.6 * (Math.cos(5 * u) + 0.75 * Math.cos(10 * u))) +
        0.6 *
          Math.cos(2 * u) *
          (-5 * Math.sin(5 * u) - 7.5 * Math.sin(10 * u))) +
    Math.cos(v) *
      (-2 *
        Math.sin(2 * u) *
        (1 + 0.6 * (Math.cos(5 * u) + 0.75 * Math.cos(10 * u))) +
        0.6 *
          Math.cos(2 * u) *
          (-5 * Math.sin(5 * u) - 7.5 * Math.sin(10 * u)));
  var nyu =
    4 *
      (Math.cos(2 * u) *
        2 *
        (1 + 0.6 * (Math.cos(5 * u) + 0.75 * Math.cos(10 * u))) +
        0.6 *
          (-5 * Math.sin(5 * u) - 0.75 * Math.sin(10 * u)) *
          Math.sin(2 * u)) +
    Math.cos(v) *
      (Math.cos(2 * u) *
        2 *
        (1 + 0.6 * (Math.cos(5 * u) + 0.75 * Math.cos(10 * u))) +
        0.6 *
          (-5 * Math.sin(5 * u) - 0.75 * Math.sin(10 * u)) *
          Math.sin(2 * u));

  var nzu = 1.75 * Math.cos(5 * u);

  var nxv =
    -Math.cos(2 * u) *
    Math.sin(v) *
    (0.6 * (Math.cos(5 * u) + 0.75 * Math.cos(10 * u)) + 1);

  var nyv =
    -Math.sin(2 * u) *
    Math.sin(v) *
    (0.6 * (Math.cos(5 * u) + 0.75 * Math.cos(10 * u)) + 1);
  var nzv = Math.cos(v);

  var n = cross(vec3(nxu, nyu, nzu), vec3(nxv, nyv, nzv));
  var n = normalize(n);

  return {
    x: x / SHRINK_VALUE,
    y: y / SHRINK_VALUE,
    z: z / SHRINK_VALUE,
    nx: n[0] / SHRINK_VALUE,
    ny: n[1] / SHRINK_VALUE,
    nz: n[2] / SHRINK_VALUE,
  };
}

function Quad(u, v) {
  var a = getVertexFromparameterizedFunction(u, v);
  var b = getVertexFromparameterizedFunction(u + 1, v);
  var c = getVertexFromparameterizedFunction(u, v + 1);
  var d = getVertexFromparameterizedFunction(u + 1, v + 1);

  var tex_size = 4096;
  var tex_a = {
    s: ((u * tex_size) % 100) / 100,
    t: ((v * tex_size) % 100) / 100,
  };
  var tex_b = {
    s: (((u + 1) * tex_size) % 100) / 100,
    t: ((v * tex_size) % 100) / 100,
  };
  var tex_c = {
    s: ((u * tex_size) % 100) / 100,
    t: (((v + 1) * tex_size) % 100) / 100,
  };
  var tex_d = {
    s: (((u + 1) * tex_size) % 100) / 100,
    t: (((v + 1) * tex_size) % 100) / 100,
  };

  // var tex_a = {
  //   s: u / 100,
  //   t: v / 100,
  // };
  // var tex_b = {
  //   s: (u + 1) / 100,
  //   t: v / 100,
  // };
  // var tex_c = {
  //   s: u / 100,
  //   t: (v + 1) / 100,
  // };
  // var tex_d = {
  //   s: (u + 1) / 100,
  //   t: (v + 1) / 100,
  // };
  // var tex_a = {
  //   s: 0,
  //   t: 0,
  // };
  // var tex_b = {
  //   s: 1,
  //   t: 0,
  // };
  // var tex_c = {
  //   s: 0,
  //   t: 1,
  // };
  // var tex_d = {
  //   s: 1,
  //   t: 1,
  // };

  pointsArray.push(vec4(a.x, a.y, a.z, 1));
  colorsArray.push(vertexColors[4]);
  textArray.push(vec2(tex_a.s, tex_a.t));
  normalsArray.push(vec4(a.nx, a.ny, a.nz, 1));

  pointsArray.push(vec4(b.x, b.y, b.z, 1));
  colorsArray.push(vertexColors[4]);
  textArray.push(vec2(tex_b.s, tex_b.t));
  normalsArray.push(vec4(b.nx, b.ny, b.nz, 1));

  pointsArray.push(vec4(c.x, c.y, c.z, 1));
  colorsArray.push(vertexColors[4]);
  textArray.push(vec2(tex_c.s, tex_c.t));
  normalsArray.push(vec4(c.nx, c.ny, c.nz, 1));

  pointsArray.push(vec4(b.x, b.y, b.z, 1));
  colorsArray.push(vertexColors[2]);
  textArray.push(vec2(tex_b.s, tex_b.t));
  normalsArray.push(vec4(b.nx, b.ny, b.nz, 1));

  pointsArray.push(vec4(c.x, c.y, c.z, 1));
  colorsArray.push(vertexColors[2]);
  textArray.push(vec2(tex_c.s, tex_c.t));
  normalsArray.push(vec4(c.nx, c.ny, c.nz, 1));

  pointsArray.push(vec4(d.x, d.y, d.z, 1));
  colorsArray.push(vertexColors[2]);
  textArray.push(vec2(tex_d.s, tex_d.t));
  normalsArray.push(vec4(d.nx, d.ny, d.nz, 1));
}

function configureTexture() {
  texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    document.getElementById("texture1")
  );
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MIN_FILTER,
    gl.NEAREST_MIPMAP_LINEAR
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

function constructTriangles() {
  for (var u = 0; u < GRID_SIZE - 1; u++) {
    for (var v = 0; v < GRID_SIZE - 1; v++) {
      Quad(u, v);
    }
  }
}
