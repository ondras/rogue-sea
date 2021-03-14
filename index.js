(() => {
  // src/proto.ts
  Array.prototype.random = function r() {
    return this[Math.floor(Math.random() * this.length)];
  };
  Array.prototype.shuffle = function() {
    let result = [];
    while (this.length) {
      let index = Math.floor(Math.random() * this.length);
      result.push(this.splice(index, 1)[0]);
    }
    return result;
  };
  Array.prototype.norm = function() {
    return Math.sqrt(this[0] * this[0] + this[1] * this[1]);
  };
  Number.prototype.mod = function(n) {
    return (this % n + n) % n;
  };

  // node_modules/fastiles/js/utils.js
  var QUAD = [
    0,
    0,
    1,
    0,
    0,
    1,
    0,
    1,
    1,
    0,
    1,
    1
  ];
  function createProgram(gl, ...sources) {
    const p = gl.createProgram();
    [gl.VERTEX_SHADER, gl.FRAGMENT_SHADER].forEach((type, index) => {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, sources[index]);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(gl.getShaderInfoLog(shader));
      }
      gl.attachShader(p, shader);
    });
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(p));
    }
    return p;
  }
  function createTexture(gl) {
    let t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    return t;
  }

  // node_modules/fastiles/js/shaders.js
  var VS = `
#version 300 es

in uvec2 position;
in uvec2 uv;
in uint glyph;
in uint style;

out vec2 fsUv;
flat out uint fsStyle;
flat out uint fsGlyph;

uniform highp uvec2 tileSize;
uniform uvec2 viewportSize;

void main() {
	ivec2 positionPx = ivec2(position * tileSize);
	vec2 positionNdc = (vec2(positionPx * 2) / vec2(viewportSize))-1.0;
	positionNdc.y *= -1.0;
	gl_Position = vec4(positionNdc, 0.0, 1.0);

	fsUv = vec2(uv);
	fsStyle = style;
	fsGlyph = glyph;
}`.trim();
  var FS = `
#version 300 es
precision highp float;

in vec2 fsUv;
flat in uint fsStyle;
flat in uint fsGlyph;

out vec4 fragColor;
uniform sampler2D font;
uniform sampler2D palette;
uniform highp uvec2 tileSize;

void main() {
	uvec2 fontTiles = uvec2(textureSize(font, 0)) / tileSize;
	uvec2 fontPosition = uvec2(fsGlyph % fontTiles.x, fsGlyph / fontTiles.x);
	uvec2 fontPx = (tileSize * fontPosition) + uvec2(vec2(tileSize) * fsUv);

	vec3 texel = texelFetch(font, ivec2(fontPx), 0).rgb;
	vec3 fg = texelFetch(palette, ivec2(fsStyle & uint(0xFF), 0), 0).rgb;
	vec3 bg = texelFetch(palette, ivec2(fsStyle >> 8, 0), 0).rgb;

	fragColor = vec4(mix(bg, fg, texel), 1.0);
}`.trim();

  // node_modules/fastiles/js/palette.js
  var Palette = class {
    constructor() {
      this._length = 0;
      this._scene = null;
      let canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 1;
      this._ctx = canvas.getContext("2d");
    }
    static default() {
      return this.fromArray(["black", "white"]);
    }
    static windows16() {
      return this.fromArray(WINDOWS_16);
    }
    static xterm256() {
      return this.fromArray(XTERM_256);
    }
    static rexpaint() {
      return this.fromArray(REXPAINT);
    }
    static rexpaint8() {
      return this.fromArray(REXPAINT_8);
    }
    static fromArray(data) {
      let p = new this();
      data.forEach((c) => p.add(c));
      return p;
    }
    set scene(scene) {
      this._scene = scene;
      scene && scene.uploadPaletteData(this._ctx.canvas);
    }
    get length() {
      return this._length;
    }
    set(index, color) {
      const ctx2 = this._ctx;
      ctx2.fillStyle = color;
      ctx2.fillRect(index, 0, 1, 1);
      this._scene && this._scene.uploadPaletteData(ctx2.canvas);
      return index;
    }
    add(color) {
      return this.set(this._length++, color);
    }
    clear() {
      const ctx2 = this._ctx;
      ctx2.clearRect(0, 0, ctx2.canvas.width, ctx2.canvas.height);
      this._length = 0;
    }
  };
  var palette_default = Palette;
  var WINDOWS_16 = ["black", "gray", "maroon", "red", "green", "lime", "olive", "yellow", "navy", "blue", "purple", "fuchsia", "teal", "aqua", "silver", "white"];
  var XTERM_256 = ["#000000", "#800000", "#008000", "#808000", "#000080", "#800080", "#008080", "#c0c0c0", "#808080", "#ff0000", "#00ff00", "#ffff00", "#0000ff", "#ff00ff", "#00ffff", "#ffffff", "#000000", "#00005f", "#000087", "#0000af", "#0000d7", "#0000ff", "#005f00", "#005f5f", "#005f87", "#005faf", "#005fd7", "#005fff", "#008700", "#00875f", "#008787", "#0087af", "#0087d7", "#0087ff", "#00af00", "#00af5f", "#00af87", "#00afaf", "#00afd7", "#00afff", "#00d700", "#00d75f", "#00d787", "#00d7af", "#00d7d7", "#00d7ff", "#00ff00", "#00ff5f", "#00ff87", "#00ffaf", "#00ffd7", "#00ffff", "#5f0000", "#5f005f", "#5f0087", "#5f00af", "#5f00d7", "#5f00ff", "#5f5f00", "#5f5f5f", "#5f5f87", "#5f5faf", "#5f5fd7", "#5f5fff", "#5f8700", "#5f875f", "#5f8787", "#5f87af", "#5f87d7", "#5f87ff", "#5faf00", "#5faf5f", "#5faf87", "#5fafaf", "#5fafd7", "#5fafff", "#5fd700", "#5fd75f", "#5fd787", "#5fd7af", "#5fd7d7", "#5fd7ff", "#5fff00", "#5fff5f", "#5fff87", "#5fffaf", "#5fffd7", "#5fffff", "#870000", "#87005f", "#870087", "#8700af", "#8700d7", "#8700ff", "#875f00", "#875f5f", "#875f87", "#875faf", "#875fd7", "#875fff", "#878700", "#87875f", "#878787", "#8787af", "#8787d7", "#8787ff", "#87af00", "#87af5f", "#87af87", "#87afaf", "#87afd7", "#87afff", "#87d700", "#87d75f", "#87d787", "#87d7af", "#87d7d7", "#87d7ff", "#87ff00", "#87ff5f", "#87ff87", "#87ffaf", "#87ffd7", "#87ffff", "#af0000", "#af005f", "#af0087", "#af00af", "#af00d7", "#af00ff", "#af5f00", "#af5f5f", "#af5f87", "#af5faf", "#af5fd7", "#af5fff", "#af8700", "#af875f", "#af8787", "#af87af", "#af87d7", "#af87ff", "#afaf00", "#afaf5f", "#afaf87", "#afafaf", "#afafd7", "#afafff", "#afd700", "#afd75f", "#afd787", "#afd7af", "#afd7d7", "#afd7ff", "#afff00", "#afff5f", "#afff87", "#afffaf", "#afffd7", "#afffff", "#d70000", "#d7005f", "#d70087", "#d700af", "#d700d7", "#d700ff", "#d75f00", "#d75f5f", "#d75f87", "#d75faf", "#d75fd7", "#d75fff", "#d78700", "#d7875f", "#d78787", "#d787af", "#d787d7", "#d787ff", "#d7af00", "#d7af5f", "#d7af87", "#d7afaf", "#d7afd7", "#d7afff", "#d7d700", "#d7d75f", "#d7d787", "#d7d7af", "#d7d7d7", "#d7d7ff", "#d7ff00", "#d7ff5f", "#d7ff87", "#d7ffaf", "#d7ffd7", "#d7ffff", "#ff0000", "#ff005f", "#ff0087", "#ff00af", "#ff00d7", "#ff00ff", "#ff5f00", "#ff5f5f", "#ff5f87", "#ff5faf", "#ff5fd7", "#ff5fff", "#ff8700", "#ff875f", "#ff8787", "#ff87af", "#ff87d7", "#ff87ff", "#ffaf00", "#ffaf5f", "#ffaf87", "#ffafaf", "#ffafd7", "#ffafff", "#ffd700", "#ffd75f", "#ffd787", "#ffd7af", "#ffd7d7", "#ffd7ff", "#ffff00", "#ffff5f", "#ffff87", "#ffffaf", "#ffffd7", "#ffffff", "#080808", "#121212", "#1c1c1c", "#262626", "#303030", "#3a3a3a", "#444444", "#4e4e4e", "#585858", "#626262", "#6c6c6c", "#767676", "#808080", "#8a8a8a", "#949494", "#9e9e9e", "#a8a8a8", "#b2b2b2", "#bcbcbc", "#c6c6c6", "#d0d0d0", "#dadada", "#e4e4e4", "#eeeeee"];
  var REXPAINT = [
    [64, 0, 0],
    [102, 0, 0],
    [140, 0, 0],
    [178, 0, 0],
    [217, 0, 0],
    [255, 0, 0],
    [255, 51, 51],
    [255, 102, 102],
    [0, 32, 64],
    [0, 51, 102],
    [0, 70, 140],
    [0, 89, 178],
    [0, 108, 217],
    [0, 128, 255],
    [51, 153, 255],
    [102, 178, 255],
    [64, 16, 0],
    [102, 26, 0],
    [140, 35, 0],
    [178, 45, 0],
    [217, 54, 0],
    [255, 64, 0],
    [255, 102, 51],
    [255, 140, 102],
    [0, 0, 64],
    [0, 0, 102],
    [0, 0, 140],
    [0, 0, 178],
    [0, 0, 217],
    [0, 0, 255],
    [51, 51, 255],
    [102, 102, 255],
    [64, 32, 0],
    [102, 51, 0],
    [140, 70, 0],
    [178, 89, 0],
    [217, 108, 0],
    [255, 128, 0],
    [255, 153, 51],
    [255, 178, 102],
    [16, 0, 64],
    [26, 0, 102],
    [35, 0, 140],
    [45, 0, 178],
    [54, 0, 217],
    [64, 0, 255],
    [102, 51, 255],
    [140, 102, 255],
    [64, 48, 0],
    [102, 77, 0],
    [140, 105, 0],
    [178, 134, 0],
    [217, 163, 0],
    [255, 191, 0],
    [255, 204, 51],
    [255, 217, 102],
    [32, 0, 64],
    [51, 0, 102],
    [70, 0, 140],
    [89, 0, 178],
    [108, 0, 217],
    [128, 0, 255],
    [153, 51, 255],
    [178, 102, 255],
    [64, 64, 0],
    [102, 102, 0],
    [140, 140, 0],
    [178, 178, 0],
    [217, 217, 0],
    [255, 255, 0],
    [255, 255, 51],
    [255, 255, 102],
    [48, 0, 64],
    [77, 0, 102],
    [105, 0, 140],
    [134, 0, 178],
    [163, 0, 217],
    [191, 0, 255],
    [204, 51, 255],
    [217, 102, 255],
    [48, 64, 0],
    [77, 102, 0],
    [105, 140, 0],
    [134, 178, 0],
    [163, 217, 0],
    [191, 255, 0],
    [204, 255, 51],
    [217, 255, 102],
    [64, 0, 64],
    [102, 0, 102],
    [140, 0, 140],
    [178, 0, 178],
    [217, 0, 217],
    [255, 0, 255],
    [255, 51, 255],
    [255, 102, 255],
    [32, 64, 0],
    [51, 102, 0],
    [70, 140, 0],
    [89, 178, 0],
    [108, 217, 0],
    [128, 255, 0],
    [153, 255, 51],
    [178, 255, 102],
    [64, 0, 48],
    [102, 0, 77],
    [140, 0, 105],
    [178, 0, 134],
    [217, 0, 163],
    [255, 0, 191],
    [255, 51, 204],
    [255, 102, 217],
    [0, 64, 0],
    [0, 102, 0],
    [0, 140, 0],
    [0, 178, 0],
    [0, 217, 0],
    [0, 255, 0],
    [51, 255, 51],
    [102, 255, 102],
    [64, 0, 32],
    [102, 0, 51],
    [140, 0, 70],
    [178, 0, 89],
    [217, 0, 108],
    [255, 0, 128],
    [255, 51, 153],
    [255, 102, 178],
    [0, 64, 32],
    [0, 102, 51],
    [0, 140, 70],
    [0, 178, 89],
    [0, 217, 108],
    [0, 255, 128],
    [51, 255, 153],
    [102, 255, 178],
    [64, 0, 16],
    [102, 0, 26],
    [140, 0, 35],
    [178, 0, 45],
    [217, 0, 54],
    [255, 0, 64],
    [255, 51, 102],
    [255, 102, 140],
    [0, 64, 48],
    [0, 102, 77],
    [0, 140, 105],
    [0, 178, 134],
    [0, 217, 163],
    [0, 255, 191],
    [51, 255, 204],
    [102, 255, 217],
    [26, 26, 26],
    [51, 51, 51],
    [77, 77, 77],
    [102, 102, 102],
    [128, 128, 128],
    [158, 158, 158],
    [191, 191, 191],
    [222, 222, 222],
    [0, 64, 64],
    [0, 102, 102],
    [0, 140, 140],
    [0, 178, 178],
    [0, 217, 217],
    [0, 255, 255],
    [51, 255, 255],
    [102, 255, 255],
    [26, 20, 13],
    [51, 41, 26],
    [77, 61, 38],
    [102, 82, 51],
    [128, 102, 64],
    [158, 134, 100],
    [191, 171, 143],
    [222, 211, 195],
    [0, 48, 64],
    [0, 77, 102],
    [0, 105, 140],
    [0, 134, 178],
    [0, 163, 217],
    [0, 191, 255],
    [51, 204, 255],
    [102, 217, 255],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
    [255, 255, 255],
    [255, 255, 255],
    [255, 255, 255],
    [255, 255, 255]
  ].map((color) => `rgb(${color.join(",")})`);
  var REXPAINT_8 = REXPAINT.map((_, index, all) => {
    let remainder = index % 8;
    let set = index >> 3;
    set = index < 96 ? 2 * set : (set - 12) * 2 + 1;
    return all[8 * set + remainder];
  });

  // node_modules/fastiles/js/scene.js
  var VERTICES_PER_TILE = 6;
  var Scene = class {
    constructor(options, palette6 = palette_default.default()) {
      this._data = {
        glyph: new Uint16Array(),
        style: new Uint16Array()
      };
      this._buffers = {};
      this._attribs = {};
      this._uniforms = {};
      this._drawRequested = false;
      this._gl = this._initGL();
      this.configure(options);
      this.palette = palette6;
    }
    get node() {
      return this._gl.canvas;
    }
    configure(options) {
      const gl = this._gl;
      const uniforms = this._uniforms;
      if (options.tileCount || options.tileSize) {
        const node2 = this.node;
        let tileSize = options.tileSize || [node2.width / this._tileCount[0], node2.height / this._tileCount[1]];
        let tileCount = options.tileCount || this._tileCount;
        node2.width = tileCount[0] * tileSize[0];
        node2.height = tileCount[1] * tileSize[1];
        gl.viewport(0, 0, node2.width, node2.height);
        gl.uniform2ui(uniforms["viewportSize"], node2.width, node2.height);
      }
      if (options.tileCount) {
        this._tileCount = options.tileCount;
        this._createGeometry(this._tileCount);
        this._createData(this._tileCount[0] * this._tileCount[1]);
      }
      options.tileSize && gl.uniform2uiv(uniforms["tileSize"], options.tileSize);
      options.font && this._uploadFont(options.font);
    }
    get palette() {
      return this._palette;
    }
    set palette(palette6) {
      if (this._palette) {
        this._palette.scene = null;
      }
      this._palette = palette6;
      this._palette.scene = this;
    }
    draw(position, glyph, fg, bg) {
      let index = position[1] * this._tileCount[0] + position[0];
      index *= VERTICES_PER_TILE;
      this._data.glyph[index + 2] = glyph;
      this._data.glyph[index + 5] = glyph;
      let style = (bg << 8) + fg;
      this._data.style[index + 2] = style;
      this._data.style[index + 5] = style;
      this._requestDraw();
    }
    uploadPaletteData(data) {
      const gl = this._gl;
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this._textures["palette"]);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data);
      this._requestDraw();
    }
    _initGL() {
      let node2 = document.createElement("canvas");
      let gl = node2.getContext("webgl2");
      if (!gl) {
        throw new Error("WebGL 2 not supported");
      }
      const p = createProgram(gl, VS, FS);
      gl.useProgram(p);
      const attributeCount = gl.getProgramParameter(p, gl.ACTIVE_ATTRIBUTES);
      for (let i = 0; i < attributeCount; i++) {
        gl.enableVertexAttribArray(i);
        let info = gl.getActiveAttrib(p, i);
        this._attribs[info.name] = i;
      }
      const uniformCount = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < uniformCount; i++) {
        let info = gl.getActiveUniform(p, i);
        this._uniforms[info.name] = gl.getUniformLocation(p, info.name);
      }
      gl.uniform1i(this._uniforms["font"], 0);
      gl.uniform1i(this._uniforms["palette"], 1);
      this._textures = {
        font: createTexture(gl),
        palette: createTexture(gl)
      };
      return gl;
    }
    _createGeometry(size) {
      const gl = this._gl;
      this._buffers.position && gl.deleteBuffer(this._buffers.position);
      this._buffers.uv && gl.deleteBuffer(this._buffers.uv);
      let buffers = createGeometry(gl, this._attribs, size);
      Object.assign(this._buffers, buffers);
    }
    _createData(tileCount) {
      const gl = this._gl;
      const attribs = this._attribs;
      this._buffers.glyph && gl.deleteBuffer(this._buffers.glyph);
      this._buffers.style && gl.deleteBuffer(this._buffers.style);
      this._data.glyph = new Uint16Array(tileCount * VERTICES_PER_TILE);
      this._data.style = new Uint16Array(tileCount * VERTICES_PER_TILE);
      const glyph = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, glyph);
      gl.vertexAttribIPointer(attribs["glyph"], 1, gl.UNSIGNED_SHORT, 0, 0);
      const style = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, style);
      gl.vertexAttribIPointer(attribs["style"], 1, gl.UNSIGNED_SHORT, 0, 0);
      Object.assign(this._buffers, {glyph, style});
    }
    _requestDraw() {
      if (this._drawRequested) {
        return;
      }
      this._drawRequested = true;
      requestAnimationFrame(() => this._draw());
    }
    _draw() {
      const gl = this._gl;
      this._drawRequested = false;
      gl.bindBuffer(gl.ARRAY_BUFFER, this._buffers.glyph);
      gl.bufferData(gl.ARRAY_BUFFER, this._data.glyph, gl.DYNAMIC_DRAW);
      gl.bindBuffer(gl.ARRAY_BUFFER, this._buffers.style);
      gl.bufferData(gl.ARRAY_BUFFER, this._data.style, gl.DYNAMIC_DRAW);
      gl.drawArrays(gl.TRIANGLES, 0, this._tileCount[0] * this._tileCount[1] * VERTICES_PER_TILE);
    }
    _uploadFont(pixels) {
      const gl = this._gl;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this._textures["font"]);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      this._requestDraw();
    }
  };
  var scene_default = Scene;
  function createGeometry(gl, attribs, size) {
    let tileCount = size[0] * size[1];
    let positionData = new Uint16Array(tileCount * QUAD.length);
    let uvData = new Uint8Array(tileCount * QUAD.length);
    let i = 0;
    for (let y = 0; y < size[1]; y++) {
      for (let x = 0; x < size[0]; x++) {
        QUAD.forEach((value) => {
          positionData[i] = (i % 2 ? y : x) + value;
          uvData[i] = value;
          i++;
        });
      }
    }
    const position = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, position);
    gl.vertexAttribIPointer(attribs["position"], 2, gl.UNSIGNED_SHORT, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, positionData, gl.STATIC_DRAW);
    const uv = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uv);
    gl.vertexAttribIPointer(attribs["uv"], 2, gl.UNSIGNED_BYTE, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, uvData, gl.STATIC_DRAW);
    return {position, uv};
  }

  // src/engine/renderer.ts
  var Renderer = class {
    constructor(options, palette6) {
      this.layers = [];
      this.tileCount = options.tileCount;
      let scene = new scene_default(options, palette6);
      document.body.appendChild(scene.node);
      this.scene = scene;
      this.center = [0, 0];
    }
    configure(options) {
      this.scene.configure(options);
      if (options.tileCount) {
        let center = this.center;
        this.tileCount = options.tileCount;
        this.center = center;
      }
    }
    get node() {
      return this.scene.node;
    }
    set center(center) {
      this.offset = [
        center[0] - (this.tileCount[0] >> 1),
        center[1] - (this.tileCount[1] >> 1)
      ];
      this.drawAll();
    }
    get center() {
      return [
        this.offset[0] + (this.tileCount[0] >> 1),
        this.offset[1] + (this.tileCount[1] >> 1)
      ];
    }
    get leftTop() {
      return [
        this.offset[0],
        this.offset[1]
      ];
    }
    get rightBottom() {
      return [
        this.offset[0] + this.tileCount[0],
        this.offset[1] + this.tileCount[1]
      ];
    }
    clear() {
      this.layers = [];
    }
    add(item, layer) {
      const record = {item, footprint: []};
      while (this.layers.length <= layer) {
        this.layers.push([]);
      }
      this.layers[layer].push(record);
      this.drawRecord(record, {hitTest: true});
    }
    remove(item) {
      let record;
      this.layers.forEach((layer) => {
        let index = layer.findIndex((record2) => record2.item == item);
        if (index > -1) {
          record = layer[index];
          layer.splice(index, 1);
        }
      });
      if (!record) {
        throw new Error("Cannot remove item; item not found");
      }
      this.drawFootprint(record);
    }
    dirty(item) {
      let record;
      this.layers.forEach((layer) => {
        let r2 = layer.find((record2) => record2.item == item);
        if (r2) {
          record = r2;
        }
      });
      if (!record) {
        throw new Error("Cannot mark dirty; item not found");
      }
      this.drawFootprint(record);
      this.drawRecord(record, {hitTest: true});
    }
    hitTest(point2) {
      let i = this.layers.length;
      while (i-- > 0) {
        let layer = this.layers[i];
        let j = layer.length;
        while (j-- > 0) {
          let record = layer[j];
          let data = record.item.query(point2);
          if (data) {
            return data;
          }
        }
      }
      throw new Error("Hit test fail");
    }
    drawAll() {
      this.layers.forEach((layer) => layer.forEach((record) => {
        this.drawRecord(record, {hitTest: false});
      }));
    }
    drawFootprint(record) {
      record.footprint.forEach((point2) => {
        this.drawData(point2, this.hitTest(point2));
      });
    }
    drawRecord(record, options) {
      record.footprint = [];
      record.item.footprint((point2, data) => {
        record.footprint.push(point2);
        this.drawData(point2, options.hitTest ? null : data);
      });
    }
    drawData(point2, data) {
      let scenePoint = [
        point2[0] - this.offset[0],
        point2[1] - this.offset[1]
      ];
      if (scenePoint[0] < 0 || scenePoint[1] < 0 || scenePoint[0] >= this.tileCount[0] || scenePoint[1] >= this.tileCount[1]) {
        return;
      }
      if (!data) {
        data = this.hitTest(point2);
      }
      this.scene.draw(scenePoint, data.ch, data.fg, data.bg);
    }
  };
  var renderer_default = Renderer;

  // src/engine/test.ts
  var tests = [];
  var stats = {
    passed: 0,
    failed: 0,
    assertions: 0
  };
  function register(test4) {
    tests.push(test4);
  }
  function assert(x, msg) {
    stats.assertions++;
    if (x) {
      return;
    }
    throw new Error(`Assertion failed: ${msg}`);
  }
  function assertEquals(x, y, msg) {
    let cx = x instanceof Array ? x.join(",") : x;
    let cy = y instanceof Array ? y.join(",") : y;
    return assert(cx == cy, `${msg} (${cx} should equal ${cy})`);
  }

  // src/engine/utils.ts
  var DIRS = [
    [-1, -1],
    [0, -1],
    [1, -1],
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0]
  ];
  var CHAR_PAIRS = `-|\\/`;
  function ensure(arr, x, y) {
    while (arr.length <= y) {
      arr.push([]);
    }
    let row = arr[y];
    while (row.length <= x) {
      row.push(null);
    }
  }
  function stringToCharArray(s) {
    let ca = [];
    while (s.startsWith("\n")) {
      s = s.substring(1);
    }
    while (s.endsWith("\n")) {
      s = s.substring(0, s.length - 1);
    }
    s.split("\n").forEach((row, y) => {
      row.split("").forEach((ch, x) => {
        ensure(ca, x, y);
        ca[y][x] = ch;
      });
    });
    return ca;
  }
  function switchChar(ch) {
    let index = CHAR_PAIRS.indexOf(ch);
    if (index == -1) {
      return ch;
    }
    let mod2 = index % 2;
    let base = Math.floor(index / 2) * 2;
    index = base + (mod2 + 1) % 2;
    return CHAR_PAIRS.charAt(index);
  }
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  function angleToOrientation(angle) {
    const PI = Math.PI;
    angle += PI;
    angle -= PI / 8;
    angle = (angle + 2 * PI) % (2 * PI);
    return Math.floor(8 * angle / (2 * PI));
  }
  register(() => {
    assertEquals(switchChar("a"), "a", "switch extra char");
    assertEquals(switchChar("-"), "|", "switch 0 char");
    assertEquals(switchChar("|"), "-", "switch 1 char");
    assertEquals(switchChar("/"), "\\", "switch 2 char");
  });

  // src/engine/port.ts
  var FONT_SIZES = [6, 8, 10, 12, 14, 16, 18, 20];
  var DPR = window.devicePixelRatio;
  var FONTS = {};
  async function loadImage(src) {
    let img = new Image();
    img.src = src;
    await img.decode();
    return img;
  }
  function adjustByDPR(size) {
    let adjusted = Math.round(size * DPR);
    if (!(adjusted in FONTS)) {
      const source = FONTS[size];
      let canvas = document.createElement("canvas");
      canvas.width = source.width / size * adjusted;
      canvas.height = source.height / size * adjusted;
      let ctx2 = canvas.getContext("2d");
      ctx2.imageSmoothingEnabled = false;
      ctx2.drawImage(source, 0, 0, canvas.width, canvas.height);
      FONTS[adjusted] = canvas;
    }
    return adjusted;
  }
  function computeSceneOptions(node2, tileSize) {
    let tileCount = computeTileCount(node2, tileSize);
    let adjustedTileSize = adjustByDPR(tileSize);
    return {
      tileCount,
      tileSize: [adjustedTileSize, adjustedTileSize],
      font: FONTS[adjustedTileSize]
    };
  }
  function computeTileCount(node2, tileSize) {
    return [node2.offsetWidth, node2.offsetHeight].map((size) => {
      let tiles = Math.ceil(size / tileSize);
      if (tiles % 2 == 0) {
        tiles++;
      }
      return tiles;
    });
  }
  async function init() {
    let promises = FONT_SIZES.map((size) => loadImage(`font/${size}.png`));
    let images = await Promise.all(promises);
    images.forEach((image, i) => FONTS[FONT_SIZES[i]] = image);
  }
  var Port = class {
    constructor(parent2, tileSize, palette6) {
      this.parent = parent2;
      this.tileSize = tileSize;
      let options = computeSceneOptions(parent2, tileSize);
      this.renderer = new renderer_default(options, palette6);
      parent2.appendChild(this.renderer.node);
      this.updateSceneSize(options.tileCount);
      window.addEventListener("resize", (_) => this.sync());
    }
    static bestSize(parent2, tileCountHorizontal, palette6) {
      const idealSize = parent2.offsetWidth / tileCountHorizontal;
      const bts = FONT_SIZES.slice().sort((a, b) => Math.abs(a - idealSize) - Math.abs(b - idealSize))[0];
      return new this(parent2, bts, palette6);
    }
    static smallestTiles(parent2, palette6) {
      return new this(parent2, FONT_SIZES[0], palette6);
    }
    sync() {
      let tileCount = computeTileCount(this.parent, this.tileSize);
      this.renderer.configure({tileCount});
      this.updateSceneSize(tileCount);
    }
    adjustTileSize(diff) {
      let index = FONT_SIZES.indexOf(this.tileSize) + diff;
      if (index < 0 || index >= FONT_SIZES.length) {
        return false;
      }
      this.tileSize = FONT_SIZES[index];
      let options = computeSceneOptions(this.parent, this.tileSize);
      this.renderer.configure(options);
      this.updateSceneSize(options.tileCount);
      return true;
    }
    updateSceneSize(tileCount) {
      const node2 = this.renderer.node;
      const width = tileCount[0] * this.tileSize;
      const height = tileCount[1] * this.tileSize;
      node2.style.width = `${width}px`;
      node2.style.height = `${height}px`;
      node2.style.left = `${(this.parent.offsetWidth - width) / 2}px`;
      node2.style.top = `${(this.parent.offsetHeight - height) / 2}px`;
    }
    async panAndZoomTo(target) {
      const {renderer: renderer2} = this;
      function d2(p1, p2) {
        let dx = p1[0] - p2[0];
        let dy = p1[1] - p2[1];
        return [dx, dy].norm();
      }
      const tileCount = computeTileCount(this.parent, this.tileSize);
      while (true) {
        let distance = d2(this.renderer.center, target);
        if (distance == 0) {
          break;
        }
        let candidates = DIRS.map((dir) => {
          let position = [renderer2.center[0] + dir[0], renderer2.center[1] + dir[1]];
          let distance2 = d2(position, target);
          return {position, distance: distance2};
        });
        candidates.sort((a, b) => a.distance - b.distance);
        this.renderer.center = candidates.shift().position;
        this.updateSceneSize(tileCount);
        await sleep(30);
      }
      while (true) {
        let ok = this.adjustTileSize(1);
        if (!ok) {
          break;
        }
        await sleep(50);
      }
    }
  };
  var port_default = Port;

  // src/keyboard.ts
  function wait() {
    return new Promise((resolve) => {
      window.addEventListener("keydown", resolve, {once: true});
    });
  }
  async function waitFor(...keys) {
    while (true) {
      let event = await wait();
      if (keys.includes(event.key)) {
        return event.key;
      }
    }
  }

  // src/audio.ts
  var COUNTS = {
    cannon: 8,
    shot: 1,
    splash: 2,
    crash: 2,
    hit: 2
  };
  var NAMES = {};
  var BUFFERS = {};
  var ctx = new AudioContext();
  var renderer;
  function inPort(point2) {
    const lt = renderer.leftTop;
    const rb = renderer.rightBottom;
    return point2[0] >= lt[0] && point2[0] <= rb[0] && point2[1] >= lt[1] && point2[1] <= rb[1];
  }
  function createPanner() {
    let panner = ctx.createPanner();
    panner.rolloffFactor = 0.1;
    return panner;
  }
  function updateListener() {
    let center = renderer.center;
    ctx.listener.setPosition(center[0], 1, center[1]);
  }
  function nameToPath(name) {
    return `audio/${name}.mp3`;
  }
  function tada() {
    new Audio(nameToPath("tada")).play();
  }
  function sfx(type, position) {
    if (!inPort(position)) {
      return;
    }
    let source = ctx.createBufferSource();
    let name = NAMES[type].random();
    source.buffer = BUFFERS[name];
    let panner = createPanner();
    source.connect(panner);
    panner.connect(ctx.destination);
    updateListener();
    panner.setPosition(position[0], 0, position[1]);
    source.start();
  }
  var Shot = class {
    constructor(position) {
      this.source = ctx.createBufferSource();
      this.panner = createPanner();
      updateListener();
      let name = NAMES["shot"].random();
      this.source.buffer = BUFFERS[name];
      let gain = ctx.createGain();
      gain.gain.value = 0.3;
      this.source.connect(gain);
      gain.connect(this.panner);
      this.panner.connect(ctx.destination);
      this.position(position);
      this.source.start();
    }
    position(position) {
      this.panner.setPosition(position[0], 0, position[1]);
    }
    end(type, position) {
      this.source.stop();
      sfx(type, position);
    }
  };
  function start() {
    let audio4 = new Audio(nameToPath("bg"));
    audio4.volume = 0.5;
    audio4.loop = true;
    audio4.play();
  }
  async function bufferFile(name) {
    let response = await fetch(nameToPath(name));
    let audioData = await response.arrayBuffer();
    BUFFERS[name] = await ctx.decodeAudioData(audioData);
  }
  async function init2(renderer_) {
    renderer = renderer_;
    let allNames = [];
    for (let id in COUNTS) {
      let count2 = COUNTS[id];
      let names = new Array(count2).fill(0).map((_, i) => `${id}${i.toString().padStart(2, "0")}`);
      NAMES[id] = names;
      allNames = allNames.concat(names);
    }
    let promises = allNames.map(bufferFile);
    return Promise.all(promises);
  }
  init2();

  // src/palette.ts
  var palette = palette_default.rexpaint8();
  var BLACK = 184;
  var WHITE = 188;
  var YELLOW = 37;
  var ORANGE = 29;
  var GRAY = 170;
  var GREEN = 52;
  var BROWN_LIGHT = 179;
  var BROWN_DARK = 177;
  var BLUES = [];
  var count = 20;
  for (let i = 0; i < count; i++) {
    let index = 100 + i;
    let blue = 100 + Math.round(100 * (i / count));
    palette.set(index, `rgb(30, 50, ${blue})`);
    BLUES.push(index);
  }

  // src/engine/entity.ts
  var Entity = class {
    constructor(bitmaps) {
      this.bitmaps = bitmaps;
      this._position = [0, 0];
      this._orientation = 1;
    }
    get position() {
      return this._position;
    }
    set position(position) {
      this._position = position;
      this.renderer && this.renderer.dirty(this);
    }
    get orientation() {
      return this._orientation;
    }
    set orientation(o) {
      this._orientation = o;
      this.renderer && this.renderer.dirty(this);
    }
    query(point2, position = this._position, orientation = this._orientation) {
      const bitmap2 = this.bitmaps[orientation];
      let sx = point2[0] - position[0] + bitmap2.origin[0];
      let sy = point2[1] - position[1] + bitmap2.origin[1];
      let row = bitmap2.data[sy];
      if (!row) {
        return null;
      }
      let item = row[sx];
      return item && item.renderData;
    }
    footprint(cb, position = this._position, orientation = this._orientation) {
      const bitmap2 = this.bitmaps[orientation];
      const [px, py] = [
        position[0] - bitmap2.origin[0],
        position[1] - bitmap2.origin[1]
      ];
      bitmap2.data.forEach((row, sy) => {
        row.forEach((item, sx) => {
          if (!item) {
            return;
          }
          cb([sx + px, sy + py], item.renderData);
        });
      });
    }
    fits(world, position, orientation) {
      let points = [];
      let isInSea = world.has(this);
      this.footprint((point2) => {
        if (isInSea && this.query(point2)) {
          return;
        }
        points.push(point2);
      }, position, orientation);
      return points.every((point2) => !world.query(point2));
    }
  };
  var entity_default = Entity;

  // src/island.ts
  var Island = class extends entity_default {
    constructor(type = "coconut") {
      let bitmap2 = randomShape();
      let name = randomName();
      insertName(bitmap2, name);
      super([bitmap2]);
      this._orientation = 0;
      this.name = name;
      this.type = type;
    }
    blocks(point2) {
      const bitmap2 = this.bitmaps[0];
      let sx = point2[0] - this._position[0] + bitmap2.origin[0];
      let sy = point2[1] - this._position[1] + bitmap2.origin[1];
      let row = bitmap2.data[sy];
      if (!row) {
        return false;
      }
      let item = row[sx];
      if (!item) {
        return false;
      }
      return item.type == "#";
    }
    updateBackground(bg) {
      const bitmap2 = this.bitmaps[0];
      const [px, py] = [
        this.position[0] - bitmap2.origin[0],
        this.position[1] - bitmap2.origin[1]
      ];
      bitmap2.data.forEach((row, j) => row.forEach((data, i) => {
        if (!data) {
          return;
        }
        if (data.type != "name") {
          return;
        }
        data.renderData.bg = bg.query([i + px, j + py]).bg;
      }));
    }
  };
  var island_default = Island;
  function insertName(bitmap2, name) {
    let dist = 2;
    let h = bitmap2.data.length;
    let w = bitmap2.data[0].length;
    while (w < name.length) {
      for (let j = 0; j < h; j++) {
        if (w % 2) {
          bitmap2.data[j].push(null);
        } else {
          bitmap2.data[j].unshift(null);
        }
      }
      if (w % 2 == 0) {
        bitmap2.origin[0]++;
      }
      w++;
    }
    while (dist-- > 0) {
      let row = [];
      for (let i = 0; i < w; i++) {
        row.push(null);
      }
      bitmap2.data.unshift(row);
      bitmap2.origin[1]++;
      h++;
    }
    name.split("").forEach((ch, i) => {
      bitmap2.data[0][i] = {
        type: "name",
        renderData: {
          ch: ch.charCodeAt(0),
          fg: WHITE,
          bg: 0
        }
      };
    });
  }
  var subject = ["Island", "Isle", "Beach", "Beaches", "Shore", "Shores", "Chest", "Tears", "Shadow", "Rock", "Rocks", "Cliff", "Cliffs", "Hideout", "Bay", "Cove", "Grave", "Graves", "Lagoon", "Atol", "Lutefisk"];
  var person = ["Captain", "Sailor", "Pirate", "Dead man", "Corsair", "Bandit", "Monkey", "Kraken"];
  var adjective = ["Cursed", "Lonely", "Lucky", "Sunken", "Distant", "Last", "Ancient", "Hidden", "Forbidden", "Forsaken", "Old", "Sandy"];
  var ofwhat = ["Gold", "Hope", "Despair", "Sand", "Salt", "Destiny", "Wind", "Treasures", "Rum", "Fortune", "Death"];
  var COLORS = [ORANGE, BROWN_DARK, YELLOW, GRAY, GREEN];
  function randomize(strings, ...values) {
    return strings.flatMap((str, i) => {
      return i ? [values[i - 1].random(), str] : str;
    }).join("");
  }
  function randomName() {
    return [
      randomize`${person}'s ${subject}`,
      randomize`${adjective} ${subject}`,
      randomize`${subject} of ${ofwhat}`
    ].random();
  }
  function randomShape() {
    const RX = 2 + Math.floor(Math.random() * 3);
    const RY = 2 + Math.floor(Math.random() * 3);
    const color = COLORS.random();
    let origin = [RX, RY];
    let data = [];
    for (let y = -RY; y <= RY; y++) {
      let row = [];
      data.push(row);
      for (let x = -RX; x <= RX; x++) {
        let dist = Math.sqrt(x / RX * (x / RX) + y / RY * (y / RY));
        let hasCell = true;
        if (dist > 1) {
          hasCell = false;
        } else if (Math.random() + 0.5 < dist) {
          hasCell = false;
        }
        if (hasCell) {
          let renderData = {
            fg: color,
            bg: BROWN_LIGHT,
            ch: "#".charCodeAt(0)
          };
          row.push({renderData, type: "#"});
        } else {
          row.push(null);
        }
      }
    }
    return {origin, data};
  }

  // src/rules.ts
  var CANNON_RANGE = 25;
  var BASE_DURATION = 100;
  var TURN_DURATION = BASE_DURATION;
  var FIRE_DURATION = 3 * BASE_DURATION;
  var SHOT_STEP = 50;
  var COCONUTS = 4;
  var MAX_CANNONBALLS = function(cannons) {
    return cannons + 1;
  };
  var MAX_HP = function(cannons) {
    return 3 + (cannons >> 1);
  };
  var GOLD = function() {
    return 5 + Math.floor(Math.random() * 10);
  };

  // src/task.ts
  function d(p1, p2) {
    return [p1[0] - p2[0], p1[1] - p2[1]].norm();
  }
  var Task = class {
    constructor(ship) {
      this.ship = ship;
      this.prerequisities = [];
    }
    perform(sea) {
      for (let p of this.prerequisities) {
        if (p.isDone()) {
          continue;
        }
        return p.perform(sea);
      }
      return -1;
    }
  };
  var MoveToPoint = class extends Task {
    constructor(ship, point2, distance) {
      super(ship);
      this.point = point2;
      this.distance = distance;
      this.timesStuck = 0;
    }
    isDone() {
      let currentDist = d(this.ship.position, this.point);
      return currentDist <= this.distance;
    }
    perform(sea) {
      const {ship, point: point2, distance} = this;
      let dirs = [-1, 0, 1];
      if (this.timesStuck > 2) {
        dirs.push(-2, 2);
      }
      if (this.timesStuck > 3) {
        dirs.push(4);
      }
      let candidates = dirs.map((diff) => {
        let orientation = (ship.orientation + diff).mod(8);
        let dir = DIRS[orientation];
        let position = [
          ship.position[0] + dir[0],
          ship.position[1] + dir[1]
        ];
        let dist = d(position, point2);
        return {orientation, position, score: Math.abs(dist - distance)};
      }).filter((candidate2) => {
        return ship.fits(sea, ship.position, candidate2.orientation) && ship.fits(sea, candidate2.position, candidate2.orientation);
      });
      if (!candidates.length) {
        this.timesStuck++;
        return -1;
      }
      candidates.sort((a, b) => a.score - b.score);
      this.timesStuck = 0;
      let candidate = candidates.shift();
      if (candidate.orientation == ship.orientation) {
        let dx = candidate.position[0] - ship.position[0];
        let dy = candidate.position[1] - ship.position[1];
        ship.position = candidate.position;
        return BASE_DURATION * [dx, dy].norm();
      } else {
        ship.orientation = candidate.orientation;
        return TURN_DURATION;
      }
    }
  };
  var MoveToShip = class extends MoveToPoint {
    constructor(ship, target, distance) {
      super(ship, target.position, distance);
      this.target = target;
    }
    isDone() {
      this.point = this.target.position;
      return super.isDone();
    }
    perform(sea) {
      this.point = this.target.position;
      return super.perform(sea);
    }
  };
  var MoveToIsland = class extends Task {
    constructor(ship, island) {
      super(ship);
      this.island = island;
      this.prerequisities = [new MoveToPoint(ship, island.position, 0)];
    }
    isDone() {
      return this.ship.anchoredAt == this.island;
    }
  };
  var GetCannonballs = class extends Task {
    isDone() {
      return this.ship.cannonballs > 0;
    }
    perform(sea) {
      if (this.prerequisities.length == 0) {
        let island = sea.islands.filter((island2) => island2.type == "cannonballs").random();
        this.prerequisities = [
          new MoveToIsland(this.ship, island)
        ];
      }
      return super.perform(sea);
    }
  };
  var RepairShip = class extends Task {
    isDone() {
      return this.ship.hp >= this.ship.maxHP;
    }
    perform(sea) {
      if (this.prerequisities.length == 0) {
        let island = sea.islands.filter((island2) => island2.type == "repair").random();
        this.prerequisities = [
          new MoveToIsland(this.ship, island)
        ];
      }
      return super.perform(sea);
    }
  };
  var BroadsideTowards = class extends Task {
    constructor(ship, target) {
      super(ship);
      this.target = target;
    }
    isDone() {
      let dir = this.orientationToTarget();
      let dist = (dir - this.ship.orientation).mod(4);
      return dist == 2;
    }
    perform(sea) {
      const {ship} = this;
      let dir = this.orientationToTarget();
      let candidates = [-1, 1].map((diff) => {
        let orientation = (ship.orientation + diff).mod(8);
        let leftDistance = (orientation + 2 - dir).mod(4);
        let rightDistance = (orientation - 2 - dir).mod(4);
        let distance = Math.min(leftDistance, rightDistance);
        return {orientation, distance};
      }).filter((candidate) => {
        return ship.fits(sea, ship.position, candidate.orientation);
      });
      if (candidates.length == 0) {
        return -1;
      }
      candidates.sort((a, b) => a.distance - b.distance);
      ship.orientation = candidates.shift().orientation;
      return TURN_DURATION;
    }
    orientationToTarget() {
      const {ship, target} = this;
      let dx = target.position[0] - ship.position[0];
      let dy = target.position[1] - ship.position[1];
      let angle = Math.atan2(dy, dx);
      return angleToOrientation(angle);
    }
  };
  var Attack = class extends Task {
    constructor(ship, target) {
      super(ship);
      this.target = target;
      this.prerequisities = [
        new GetCannonballs(ship),
        new MoveToShip(ship, target, CANNON_RANGE),
        new BroadsideTowards(ship, target)
      ];
    }
    isDone() {
      return !this.target.alive;
    }
    async perform(sea) {
      const {ship, target} = this;
      for (let p of this.prerequisities) {
        if (p.isDone()) {
          continue;
        }
        return p.perform(sea);
      }
      let cannons = ship.cannons.map((cannon2) => {
        let position = ship.getCannonPosition(cannon2);
        if (!position) {
          return {cannon: cannon2, distance: Infinity};
        }
        let dx = target.position[0] - position[0];
        let dy = target.position[1] - position[1];
        let distance = [dx, dy].norm();
        return {cannon: cannon2, distance};
      });
      cannons.sort((a, b) => a.distance - b.distance);
      let cannon = cannons.shift();
      await ship.fire(cannon.cannon, sea);
      return FIRE_DURATION;
    }
  };

  // src/captain.ts
  var Captain = class {
    constructor(ship, personality) {
      this.ship = ship;
      this.personality = personality;
      this.tasks = [];
    }
    async act(sea) {
      let index = this.tasks.length;
      while (index-- > 0) {
        let task = this.tasks[index];
        if (task.isDone()) {
          this.tasks.splice(index, 1);
          continue;
        }
        let result = await task.perform(sea);
        if (result == -1) {
          continue;
        }
        return result;
      }
      if (this.tasks.length >= 3) {
        this.tasks.shift();
        return BASE_DURATION;
      }
      switch (this.personality) {
        case "merchant":
          this.goRandomIsland(sea);
          break;
        case "corsair":
          if (this.ship.hp < this.ship.maxHP) {
            let task = new RepairShip(this.ship);
            this.tasks.push(task);
          } else {
            let target = sea.ships.filter((s) => s != this.ship).random();
            let task = new Attack(this.ship, target);
            this.tasks.push(task);
          }
          break;
      }
      return this.act(sea);
    }
    goRandomIsland(sea) {
      let island = sea.islands.filter((i) => this.ship.anchoredAt != i).random();
      let task = new MoveToIsland(this.ship, island);
      this.tasks.push(task);
    }
    notifyHit(attacker) {
      let attackTasks = this.tasks.filter((task) => task instanceof Attack && task.target == attacker);
      if (attackTasks.length > 0) {
        return;
      }
      if (this.personality == "corsair" || Math.random() > 0.5) {
        let task = new Attack(this.ship, attacker);
        this.tasks.push(task);
      }
    }
    loot(ship) {
      this.ship.cannonballs = Math.min(this.ship.maxCannonballs, this.ship.cannonballs + ship.cannonballs);
    }
  };
  var captain_default = Captain;

  // src/log.ts
  var node = document.querySelector("#log");
  var paragraph;
  var lines = [];
  function text(text2, id) {
    if (id && lines.length > 0 && lines[lines.length - 1].id == id) {
      lines[lines.length - 1].count++;
    } else {
      lines.push({text: text2, count: 1, id});
    }
    paragraph.innerHTML = lines.map((line) => {
      if (line.count > 1) {
        return `${line.text} (x${line.count})`;
      } else {
        return line.text;
      }
    }).join(" ");
    node.scrollTop = node.scrollHeight;
  }
  function newline() {
    paragraph = document.createElement("p");
    node.appendChild(paragraph);
    lines = [];
  }
  function swear(str, id) {
    let prefix = [
      "Arr,",
      "Arr!",
      "Arghh!",
      "Scurvy!",
      "Aye cap'n,",
      "Avast ye,",
      "Yo ho,",
      "Shiver me timbers!",
      "Matey,"
    ].random();
    if (prefix.endsWith(",")) {
      str = `${str.charAt(0).toLowerCase()}${str.substring(1)}`;
    }
    return text(`${prefix} ${str}`, id);
  }
  function init3() {
    newline();
  }
  init3();

  // src/ship.ts
  var Ship = class extends entity_default {
    constructor() {
      super(...arguments);
      this.maxCannonballs = MAX_CANNONBALLS(this.cannons.length);
      this.maxHP = MAX_HP(this.cannons.length);
      this.cannonballs = this.maxCannonballs;
      this.hp = this.maxHP;
      this.name = randomName2();
      this.gold = GOLD();
    }
    get alive() {
      return this.hp > 0;
    }
    async act(sea) {
      let time = BASE_DURATION;
      if (this.captain) {
        time = await this.captain.act(sea);
      }
      await this.updateAnchor(sea);
      return time;
    }
    get cannons() {
      let avail = ["1", "4", "7", "3", "6", "9"];
      let cannons = [];
      const bitmap2 = this.bitmaps[this.orientation];
      bitmap2.data.forEach((row) => {
        row.forEach((item) => {
          if (!item) {
            return;
          }
          avail.includes(item.type) && cannons.push(item.type);
        });
      });
      return cannons;
    }
    async fire(cannon, sea) {
      let position = this.getCannonPosition(cannon);
      if (!position) {
        return null;
      }
      this.cannonballs--;
      sfx("cannon", position);
      this.notifyFire(cannon);
      let diff = Number(cannon) % 3 ? -2 : 2;
      let o = (this.orientation + diff).mod(8);
      let shot = sea.createShot();
      let target = await shot.fly(position, o);
      this.notifyFireTarget(target);
      if (target instanceof Ship) {
        target.hit(this, sea);
      }
      return target;
    }
    hit(attacker, sea) {
      this.hp--;
      if (this.alive) {
        this.captain && this.captain.notifyHit(attacker);
      } else {
        this.die(sea, attacker);
        attacker.captain && attacker.captain.loot(this);
      }
    }
    getCannonPosition(cannon) {
      const bitmap2 = this.bitmaps[this.orientation];
      let position = null;
      const [px, py] = [
        this.position[0] - bitmap2.origin[0],
        this.position[1] - bitmap2.origin[1]
      ];
      bitmap2.data.forEach((row, sy) => {
        row.forEach((item, sx) => {
          if (!item) {
            return;
          }
          if (item.type != cannon) {
            return;
          }
          position = [sx + px, sy + py];
        });
      });
      return position;
    }
    die(sea, attacker) {
      sea.remove(this);
      this.notifyDeath(attacker);
      sea.createAnotherShip(this);
    }
    updateAnchor(sea) {
      let dir = DIRS[this.orientation];
      let position = [
        this.position[0] + dir[0],
        this.position[1] + dir[1]
      ];
      let islandFound;
      this.footprint((point2) => {
        let queried = sea.query(point2);
        if (queried instanceof island_default) {
          islandFound = queried;
        }
      }, position, this.orientation);
      if (this.anchoredAt != islandFound) {
        return this.anchorAt(islandFound);
      }
    }
    anchorAt(island) {
      this.anchoredAt = island;
      if (!island) {
        return;
      }
      if (island.type == "cannonballs") {
        this.cannonballs = this.maxCannonballs;
      }
      if (island.type == "repair") {
        this.hp = this.maxHP;
      }
    }
    notifyFire(_cannon) {
      let hear = ["hear", "'earr"].random();
      let where = ["", " in the distance"].random();
      text(`Ya ${hear} a cannon shootin'${where}.`, "cannon-shot");
    }
    notifyFireTarget(target) {
      if (target instanceof PlayerShip) {
        let hit = ["is hit", "be 'it"].random();
        swear(`Yer ship ${hit}!`);
      }
    }
    notifyDeath(attacker) {
      let name = attacker instanceof PlayerShip ? "She" : this.name;
      text([
        `${name} goes down!`,
        `${name} is sunk!`,
        `${name} be down!`,
        `${name} be down to Davy Jones' Locker!`
      ].random());
    }
  };
  var ship_default = Ship;
  var PlayerShip = class extends Ship {
    constructor() {
      super(...arguments);
      this.coconuts = 0;
    }
    get position() {
      return super.position;
    }
    set position(position) {
      this._position = position;
      if (this.renderer) {
        this.renderer.center = position;
      }
    }
    die(sea, attacker) {
      sea.remove(this);
      this.notifyDeath(attacker);
      sea.stop();
    }
    anchorAt(island) {
      super.anchorAt(island);
      if (!island) {
        return;
      }
      text(`Ye anchor yer ship at ${island.name}.`);
      if (island.type == "cannonballs") {
        text(`Yer cannons be loaded with cannonballs.`);
      } else if (island.type == "repair") {
        text(`Yer ship, ${this.name}, gets 'er deck fixed right away.`);
      } else if (island.type == "coconut" && this.captain && this.captain.target == island) {
        this.coconuts++;
        let type = ["sweet", "large", "tasty", "yummy"].random();
        text(`Ye collect a ${type} coconut.`);
      } else {
        text("There be nothin' to see 'ere.");
      }
      if (this.captain && this.captain.target == island) {
        return this.captain.targetFound();
      }
    }
    notifyFire(cannon) {
      let side = Number(cannon) % 3 ? "port" : "starboard";
      let you = ["Ye", "Ya"].random();
      let adj = ["the ol'", "the rusty", "yer trusty"].random();
      text(`${you} fire ${adj} cannon to the ${side} side.`);
    }
    notifyFireTarget(target) {
      if (target instanceof Ship) {
        text([
          `The shot ${["'its", "hits"].random()} ${target.name}.`,
          `${target.name} be ${["'it", "hit"].random()} by the shot.`
        ].random());
      }
      if (target instanceof island_default) {
        text(`The shot crashes into ${target.name}.`);
      }
      if (!target) {
        let hit = ["'it", "hit"].random();
        text([
          `${["The", "Yer"].random()} shot misses.`,
          `Ya do not ${hit} anythin'.`
        ].random());
      }
    }
  };
  var NAMES2 = ["Boaty", "Booty", "Pearl", "Betty", "Folly", "Jewel", "Blade", "Monkee", "Rose"];
  function randomName2() {
    let name = NAMES2.random();
    return [
      `${name} Mc${name}face`,
      `Old ${name}`,
      `Jolly ${name}`,
      `${name}'s Fortune`,
      `Bloody ${name}`,
      `Royal ${name}`
    ].random();
  }

  // src/status.ts
  var HEADINGS = ["NW", "N", "NE", "E", "SE", "S", "SW", "W"];
  var parent = document.querySelector("#status");
  var Status = class {
    constructor(ship) {
      this._dom = {};
      ["target", "cannonballs", "hp", "gold", "coconuts"].forEach((id) => {
        this._dom[id] = parent.querySelector(`#${id} dd`);
      }, this);
      this.ship = ship;
    }
    get ship() {
      return this._ship;
    }
    set ship(ship) {
      this._ship = ship;
      this.update();
    }
    get target() {
      return this._target;
    }
    set target(target) {
      this._target = target;
      this.update();
    }
    update() {
      this._dom["cannonballs"].innerHTML = `${this.ship.cannonballs} / ${this.ship.maxCannonballs}`;
      this._dom["hp"].innerHTML = new Array(this.ship.hp).fill("#").join("");
      this._dom["gold"].innerHTML = String(this.ship.gold);
      this._dom["coconuts"].innerHTML = String(this.ship.coconuts);
      let target = "(none)";
      if (this.target) {
        let island = this.target;
        target = island.name;
        let dir = [
          island.position[0] - this.ship.position[0],
          island.position[1] - this.ship.position[1]
        ];
        let angle = Math.atan2(dir[1], dir[0]);
        let heading = HEADINGS[angleToOrientation(angle)];
        target = `${target} (${heading})`;
      }
      this._dom["target"].innerHTML = target;
    }
  };
  var status_default = Status;

  // src/player.ts
  var Player = class extends captain_default {
    constructor(ship, level) {
      super(ship, "");
      this.ship = ship;
      this.level = level;
      this.status = new status_default(ship);
    }
    get target() {
      return this._target;
    }
    set target(target) {
      this._target = target;
      this.status.target = target;
    }
    async act(sea) {
      newline();
      this.status.update();
      while (true) {
        let event = await wait();
        let result = await this.processEvent(event, sea);
        if (result) {
          this.status.update();
          return result;
        }
      }
    }
    async processEvent(event, sea) {
      switch (true) {
        case event.key == "ArrowUp":
        case event.code == "KeyW":
        case event.code == "KeyK":
          return this.tryForward(sea);
          break;
        case event.key == "ArrowLeft":
        case event.code == "KeyA":
        case event.code == "KeyH":
          return this.tryTurn(-1, sea);
          break;
        case event.key == "ArrowRight":
        case event.code == "KeyD":
        case event.code == "KeyL":
          return this.tryTurn(1, sea);
          break;
        case [" ", ".", "Enter"].includes(event.key):
          return BASE_DURATION;
          break;
      }
      if (this.ship.cannons.includes(event.key)) {
        return this.tryFiring(event.key, sea);
      }
      return 0;
    }
    tryForward(sea) {
      let diff = DIRS[this.ship.orientation];
      let position = [
        this.ship.position[0] + diff[0],
        this.ship.position[1] + diff[1]
      ];
      if (!this.ship.fits(sea, position, this.ship.orientation)) {
        let way = ["path", "way"].random();
        swear(`Somethin' be blockin' the ${way}.`, "no-forward");
        return 0;
      }
      this.ship.position = position;
      return 100 * diff.norm();
    }
    tryTurn(diff, sea) {
      let o = (this.ship.orientation + diff).mod(8);
      if (!this.ship.fits(sea, this.ship.position, o)) {
        let turn = ["to turn", "for turnin'"].random();
        swear(`There be no space ${turn} that way.`, "no-rotate");
        return 0;
      }
      this.ship.orientation = o;
      return TURN_DURATION;
    }
    async tryFiring(cannon, sea) {
      if (!this.ship.cannonballs) {
        swear("Ye have no cannonballs to fire!", "no-cannonballs");
        return 0;
      }
      await this.ship.fire(cannon, sea);
      return FIRE_DURATION;
    }
    loot(ship) {
      tada();
      if (ship.cannonballs > 0) {
        if (Math.random() > 0.5) {
          this.lootCannonballs(ship);
        } else {
          this.lootGold(ship);
        }
      } else {
        this.lootGold(ship);
      }
    }
    lootCannonballs(ship) {
      this.ship.cannonballs = Math.min(this.ship.maxCannonballs, this.ship.cannonballs + ship.cannonballs);
      text("Ye salvage some useful cannonballs from the wreck.");
    }
    lootGold(ship) {
      this.ship.gold += ship.gold;
      text(`Ye salvage <span class='gold'>${ship.gold} gold</span> from the wreck.`);
    }
    targetFound() {
      this.status.update();
      return this.level.targetFound();
    }
  };
  var player_default = Player;

  // src/engine/world.ts
  var World = class {
    constructor(renderer2, bg) {
      this.renderer = renderer2;
      this.bg = bg;
      renderer2.add(bg, 0);
    }
  };
  var world_default = World;

  // src/engine/timeloop.ts
  var TimeLoop = class {
    constructor() {
      this.queue = [];
      this.stopped = false;
      this.timeScale = 1;
    }
    next() {
      let first = this.queue.shift();
      this.queue.forEach((record) => record.remaining -= first.remaining);
      return first.actor;
    }
    add(actor, remaining = 0) {
      let record = {actor, remaining};
      let index = 0;
      while (index < this.queue.length && this.queue[index].remaining <= remaining) {
        index++;
      }
      this.queue.splice(index, 0, record);
    }
    remove(actor) {
      let index = this.queue.findIndex((record) => record.actor == actor);
      if (index == -1) {
        throw new Error("Cannot find actor to be removed");
      }
      this.queue.splice(index, 1);
    }
    async start(world) {
      this.stopped = false;
      while (1) {
        if (this.stopped) {
          break;
        }
        let actor = this.next();
        let duration = await actor.act(world);
        this.add(actor, duration);
        if (this.timeScale > 0) {
          await sleep(duration * this.timeScale);
        }
      }
    }
    stop() {
      this.stopped = true;
    }
  };
  var timeloop_default = TimeLoop;

  // src/engine/background.ts
  var Background = class {
    constructor(renderer2) {
      this.renderer = renderer2;
    }
    footprint(cb) {
      const lt = this.renderer.leftTop;
      const rb = this.renderer.rightBottom;
      for (let x = lt[0]; x < rb[0]; x++) {
        for (let y = lt[1]; y < rb[1]; y++) {
          let point2 = [x, y];
          cb(point2, this.query(point2));
        }
      }
    }
  };
  var background_default = Background;

  // src/noise.ts
  function mod(a, b) {
    let mod2 = a % b;
    return mod2 < 0 ? mod2 + b : mod2;
  }
  var F2 = 0.5 * (Math.sqrt(3) - 1);
  var G2 = (3 - Math.sqrt(3)) / 6;
  var SimplexNoise = class {
    constructor(gradients = 256) {
      this._gradients = [
        [0, -1],
        [1, -1],
        [1, 0],
        [1, 1],
        [0, 1],
        [-1, 1],
        [-1, 0],
        [-1, -1]
      ];
      let permutations = [];
      for (let i = 0; i < gradients; i++) {
        permutations.push(i);
      }
      permutations = permutations.shuffle();
      this._perms = [];
      this._indexes = [];
      for (let i = 0; i < 2 * gradients; i++) {
        this._perms.push(permutations[i % gradients]);
        this._indexes.push(this._perms[i] % this._gradients.length);
      }
    }
    get(xin, yin) {
      let perms = this._perms;
      let indexes = this._indexes;
      let count2 = perms.length / 2;
      let n0 = 0, n1 = 0, n2 = 0, gi;
      let s = (xin + yin) * F2;
      let i = Math.floor(xin + s);
      let j = Math.floor(yin + s);
      let t = (i + j) * G2;
      let X0 = i - t;
      let Y0 = j - t;
      let x0 = xin - X0;
      let y0 = yin - Y0;
      let i1, j1;
      if (x0 > y0) {
        i1 = 1;
        j1 = 0;
      } else {
        i1 = 0;
        j1 = 1;
      }
      let x1 = x0 - i1 + G2;
      let y1 = y0 - j1 + G2;
      let x2 = x0 - 1 + 2 * G2;
      let y2 = y0 - 1 + 2 * G2;
      let ii = mod(i, count2);
      let jj = mod(j, count2);
      let t0 = 0.5 - x0 * x0 - y0 * y0;
      if (t0 >= 0) {
        t0 *= t0;
        gi = indexes[ii + perms[jj]];
        let grad = this._gradients[gi];
        n0 = t0 * t0 * (grad[0] * x0 + grad[1] * y0);
      }
      let t1 = 0.5 - x1 * x1 - y1 * y1;
      if (t1 >= 0) {
        t1 *= t1;
        gi = indexes[ii + i1 + perms[jj + j1]];
        let grad = this._gradients[gi];
        n1 = t1 * t1 * (grad[0] * x1 + grad[1] * y1);
      }
      let t2 = 0.5 - x2 * x2 - y2 * y2;
      if (t2 >= 0) {
        t2 *= t2;
        gi = indexes[ii + 1 + perms[jj + 1]];
        let grad = this._gradients[gi];
        n2 = t2 * t2 * (grad[0] * x2 + grad[1] * y2);
      }
      return 70 * (n0 + n1 + n2);
    }
  };
  var noise_default = SimplexNoise;

  // src/water.ts
  var SCALE = 1 / 80;
  var noise = new noise_default();
  function scaleToSet(value, set) {
    return set[Math.round((value + 1) / 2 * (set.length - 1))];
  }
  var Water = class extends background_default {
    query(point2) {
      let value = noise.get(point2[0] * SCALE, point2[1] * SCALE);
      return {ch: 32, bg: scaleToSet(value, BLUES), fg: GRAY};
    }
  };
  var water_default = Water;

  // src/shot.ts
  var Shot2 = class {
    constructor(renderer2, sea) {
      this.renderer = renderer2;
      this.sea = sea;
      this.position = null;
    }
    async fly(position, orientation) {
      let target = null;
      this.position = [position[0], position[1]];
      let a = new Shot(this.position);
      let d2 = DIRS[orientation];
      while (true) {
        this.position[0] += d2[0];
        this.position[1] += d2[1];
        this.renderer.dirty(this);
        a.position(this.position);
        if (inPort(this.position)) {
          await sleep(SHOT_STEP);
        }
        let t = this.sea.query(this.position);
        if (t) {
          target = t;
          break;
        }
        let dx = this.position[0] - position[0];
        let dy = this.position[1] - position[1];
        let dist = [dx, dy].norm();
        if (dist >= CANNON_RANGE) {
          break;
        }
      }
      let sfx2 = "";
      if (target) {
        if (target instanceof ship_default) {
          sfx2 = "hit";
        }
        if (target instanceof island_default) {
          sfx2 = "crash";
        }
      } else {
        sfx2 = "splash";
      }
      a.end(sfx2, this.position);
      this.renderer.remove(this);
      return target;
    }
    footprint(cb) {
      if (!this.position) {
        return;
      }
      cb(this.position.slice(), this.renderData);
    }
    query(point2) {
      if (!this.position) {
        return null;
      }
      if (point2[0] != this.position[0] || point2[1] != this.position[1]) {
        return null;
      }
      return this.renderData;
    }
    get renderData() {
      if (!this.position) {
        throw new Error("Cannot get render data for a non-positioned shot");
      }
      let water = this.sea.bg.query(this.position);
      return {
        fg: YELLOW,
        bg: water.bg,
        ch: "*".charCodeAt(0)
      };
    }
  };
  var shot_default = Shot2;

  // src/engine/point.ts
  function rotate(point2, origin, amount) {
    let delta = [point2[0] - origin[0], point2[1] - origin[1]];
    let sign = Math.sign(amount);
    while (amount) {
      delta.reverse();
      if (sign == 1) {
        delta[0] *= -1;
      }
      if (sign == -1) {
        delta[1] *= -1;
      }
      amount -= sign;
    }
    return [delta[0] + origin[0], delta[1] + origin[1]];
  }
  register(() => {
    assertEquals(rotate([2, -1], [0, 0], 1), [1, 2], "rotatePoint cw");
    assertEquals(rotate([2, -1], [0, 0], -1), [-1, -2], "rotatePoint ccw");
    assertEquals(rotate([2, -1], [0, 0], 2), [-2, 1], "rotatePoint multiple cw");
    assertEquals(rotate([2, -1], [0, 0], -2), [-2, 1], "rotatePoint multiple ccw");
    assertEquals(rotate([0, 0], [2, 2], 1), [4, 0], "rotatePoint nonzero cw");
    assertEquals(rotate([1, 2], [2, 2], 1), [2, 1], "rotatePoint cw");
  });

  // src/engine/bitmap.ts
  function clone(s) {
    return JSON.parse(JSON.stringify(s));
  }
  function rotate2(bitmap2, amount) {
    let offset2 = [Infinity, Infinity];
    let rotated = [];
    bitmap2.data.forEach((row, y) => {
      row.forEach((t, x) => {
        let [rx, ry] = rotate([x, y], bitmap2.origin, amount);
        offset2[0] = Math.min(offset2[0], rx);
        offset2[1] = Math.min(offset2[1], ry);
        rotated.push({rx, ry, t});
      });
    });
    let data = [];
    rotated.forEach((item) => {
      item.rx -= offset2[0];
      item.ry -= offset2[1];
      ensure(data, item.rx, item.ry);
      data[item.ry][item.rx] = JSON.parse(JSON.stringify(item.t));
    });
    let origin = [
      bitmap2.origin[0] - offset2[0],
      bitmap2.origin[1] - offset2[1]
    ];
    return {data, origin};
  }
  register(() => {
    function str(s) {
      return s.data.map((r2) => r2.join("")).join("\n");
    }
    let source1 = {
      data: [["x", "o", "o"]],
      origin: [0, 0]
    };
    let rotated1 = rotate2(source1, 1);
    assertEquals(str(rotated1), "x\no\no", "rotate data");
    assertEquals(rotated1.origin, [0, 0], "rotate origin");
    let source2 = {
      data: [["x", "o", "o"]],
      origin: [1, 0]
    };
    let rotated2 = rotate2(source2, 1);
    assertEquals(str(rotated2), "x\no\no", "rotate data");
    assertEquals(rotated2.origin, [0, 1], "rotate origin");
  });

  // src/ship-data.ts
  var SIZE_0_ORIENTATION_0 = {
    chars: String.raw`
\-9
|../
7.o.\
 /.$/
  \/
`,
    type: String.raw`
ww9
wwws
7wwww
 sw$w
  ww
`,
    origin: [2, 2]
  };
  var SIZE_0_ORIENTATION_1 = {
    chars: String.raw`
  |
 /.\
 7.9
--o--
 |$|
 ---
`,
    type: String.raw`
  w
 www
 7w9
sswss
 w$w
 www
`,
    origin: [2, 3]
  };
  var SIZE_1_ORIENTATION_0 = {
    chars: String.raw`
\
 \--9/
 |../\
 |.o..6/
 7/.../\
 /\..o..\
   4/.$./
   /\../
     \/
`,
    type: String.raw`
w
 www9s
 wwwsw
 wwwww6s
 7swwwsw
 swwwwwww
   4sw$ww
   swwww
     ww
`,
    origin: [4, 4]
  };
  var SIZE_1_ORIENTATION_1 = {
    chars: String.raw`
   |
   |
  /.\
 7...9
---o---
 |...|
 4...6
---o---
 |.$.|
 -----
`,
    type: String.raw`
   w
   w
  www
 7www9
ssswsss
 wwwww
 4www6
ssswsss
 ww$ww
 wwwww
`,
    origin: [3, 5]
  };
  var SIZE_2_ORIENTATION_0 = {
    chars: String.raw`
\
 \
  \--9/
  |../\
  |.o..6/
  7/.../\
  /\..o..3/
    4/.../\
    /\..o..\
      1/.$./
      /\../
        \/
`,
    type: String.raw`
w
 w
  www9s
  wwwsw
  wwwww6s
  7swwwsw
  swwwwww3s
    4swwwsw
    swwwwwww
      1sw$ww
      swwww
        ww
`,
    origin: [6, 6]
  };
  var SIZE_2_ORIENTATION_1 = {
    chars: String.raw`
   |
   |
   |
  /.\
 7...9
---o---
 |...|
 4...6
---o---
 |...|
 1...3
---o---
 |.$.|
 -----
`,
    type: String.raw`
   w
   w
   w
  www
 7www9
ssswsss
 wwwww
 4www6
ssswsss
 wwwww
 1www3
ssswsss
 ww$ww
 wwwww
`,
    origin: [3, 8]
  };

  // src/shipyard.ts
  var TEMPLATES = [
    [SIZE_0_ORIENTATION_0, SIZE_0_ORIENTATION_1].map(parseTemplate),
    [SIZE_1_ORIENTATION_0, SIZE_1_ORIENTATION_1].map(parseTemplate),
    [SIZE_2_ORIENTATION_0, SIZE_2_ORIENTATION_1].map(parseTemplate)
  ];
  var CHARS = {
    o: 9,
    " ": 0,
    ".": 249
  };
  function expandData(data) {
    let rd = {
      ch: data.ch in CHARS ? CHARS[data.ch] : data.ch.charCodeAt(0),
      fg: 0,
      bg: BROWN_LIGHT
    };
    switch (data.type) {
      case "w":
        rd.fg = BROWN_DARK;
        break;
      case "s":
        rd.fg = WHITE;
        break;
      case "$":
        rd.fg = YELLOW;
        break;
      default:
        rd.fg = BLACK;
        break;
    }
    return rd;
  }
  function expandTemplate(template) {
    return {
      origin: template.origin,
      data: template.data.map((row) => row.map((item) => {
        if (!item) {
          return item;
        }
        return {
          type: item.type,
          renderData: expandData(item)
        };
      }))
    };
  }
  function generateTemplates(defaultTemplates) {
    let result = [];
    for (let i = 0; i < 8; i++) {
      if (i < defaultTemplates.length) {
        result.push(clone(defaultTemplates[i]));
      } else {
        let defaultIndex = i % 2;
        let defaultBitmap = defaultTemplates[defaultIndex];
        let amount = (i - defaultIndex) / 2;
        let rotated = rotate2(defaultBitmap, amount);
        if (amount % 2) {
          rotated = switchChars(rotated);
        }
        result.push(rotated);
      }
    }
    return result;
  }
  function switchChars(template) {
    template.data.forEach((row) => row.forEach((data) => {
      if (!data) {
        return;
      }
      data.ch = switchChar(data.ch);
    }));
    return template;
  }
  function parseTemplate(rawData) {
    let ca = {
      chars: stringToCharArray(rawData.chars),
      type: stringToCharArray(rawData.type)
    };
    let data = [];
    ca.chars.forEach((row, y) => {
      row.forEach((_ch, x) => {
        ensure(data, x, y);
        let ch = ca.chars[y][x];
        let type = ca.type[y][x];
        if (type == " ") {
          data[y][x] = null;
        } else {
          data[y][x] = {ch, type};
        }
      });
    });
    return {data, origin: rawData.origin};
  }
  function create(options) {
    if (!(options.size in TEMPLATES)) {
      throw new Error(`The Shipyard has no ships of size ${options.size}`);
    }
    let templates = TEMPLATES[options.size];
    let bitmaps = generateTemplates(templates).map(expandTemplate);
    if (options.pc) {
      let oldCh = "$".charCodeAt(0);
      let newCh = "@".charCodeAt(0);
      bitmaps.forEach((bitmap2) => {
        bitmap2.data.forEach((row) => {
          row.forEach((data) => {
            if (!data) {
              return;
            }
            if (data.renderData.ch == oldCh) {
              data.renderData.ch = newCh;
            }
          });
        });
      });
    }
    return new (options.pc ? PlayerShip : ship_default)(bitmaps);
  }

  // src/sea.ts
  var Sea = class extends world_default {
    constructor(renderer2) {
      super(renderer2, new water_default(renderer2));
      this.ships = [];
      this.islands = [];
      this.timeLoop = new timeloop_default();
      window.sea = this;
    }
    start(timeScale) {
      this.timeLoop.timeScale = timeScale;
      return this.timeLoop.start(this);
    }
    stop() {
      return this.timeLoop.stop();
    }
    add(entity) {
      switch (true) {
        case entity instanceof ship_default:
          let ship = entity;
          this._add(ship, this.ships, 2);
          this.timeLoop.add(ship);
          break;
        case entity instanceof island_default:
          entity.updateBackground(this.bg);
          this._add(entity, this.islands, 1);
          break;
      }
    }
    remove(entity) {
      switch (true) {
        case entity instanceof ship_default:
          let ship = entity;
          this.timeLoop.remove(ship);
          this._remove(ship, this.ships);
          break;
        case entity instanceof island_default:
          this._remove(entity, this.islands);
          break;
      }
    }
    _add(entity, list, layer) {
      list.push(entity);
      this.renderer.add(entity, layer);
      entity.renderer = this.renderer;
    }
    _remove(entity, list) {
      entity.renderer = void 0;
      this.renderer.remove(entity);
      let index = list.indexOf(entity);
      list.splice(index, 1);
    }
    has(ship) {
      return this.ships.includes(ship);
    }
    query(point2) {
      let ship = this.ships.find((ship2) => ship2.query(point2));
      if (ship) {
        return ship;
      }
      let island = this.islands.find((island2) => island2.blocks(point2));
      if (island) {
        return island;
      }
      return null;
    }
    positionNear(entity, point2) {
      let angle = Math.atan2(point2[1], point2[0]);
      let orientation = angleToOrientation(angle);
      entity.orientation = orientation;
      let dir = DIRS[orientation];
      point2 = point2.slice();
      while (1) {
        if (entity.fits(this, point2, entity.orientation)) {
          break;
        }
        point2[0] += dir[0];
        point2[1] += dir[1];
      }
      point2[0] += dir[0];
      point2[1] += dir[1];
      while (1) {
        if (entity.fits(this, point2, entity.orientation)) {
          break;
        }
        point2[0] += dir[0];
        point2[1] += dir[1];
      }
      entity.position = point2;
    }
    createShot() {
      let shot = new shot_default(this.renderer, this);
      this.renderer.add(shot, 3);
      return shot;
    }
    createAnotherShip(ship) {
      let size = [0, 1, 2].random();
      let newShip = create({size, pc: false});
      if (ship.captain) {
        newShip.captain = new captain_default(newShip, ship.captain.personality);
      }
      this.positionNear(ship, this.islands.random().position);
      this.add(ship);
    }
  };
  var sea_default = Sea;

  // src/level.ts
  var Level = class {
    constructor(difficulty, gold, port) {
      this.difficulty = difficulty;
      this.port = port;
      this.todo = [];
      this.sea = new sea_default(port.renderer);
      populate(this.sea, difficulty);
      if (difficulty == 0) {
        this.todo = ["repair", "cannonballs", "coconut"];
      }
      let pship = this.sea.ships.filter((s) => s instanceof PlayerShip)[0];
      pship.gold = gold;
      this.player = new player_default(pship, this);
    }
    async targetFound() {
      const {player, sea, difficulty, todo} = this;
      if (difficulty == 0) {
        if (todo.length > 0) {
          await this.showTutorialStep(todo.shift());
        } else {
          sea.stop();
        }
      } else {
        if (player.ship.coconuts >= COCONUTS) {
          sea.stop();
        } else {
          player.target = sea.islands.filter((i) => i.type == "coconut" && i != player.ship.anchoredAt).random();
        }
      }
    }
    async play() {
      const {port, difficulty, player, sea} = this;
      if (difficulty == 0) {
        let wantsTutorial = await this.showDemo();
        if (!wantsTutorial) {
          port.renderer.clear();
          return player.ship;
        }
      }
      await this.showIntro();
      await sea.start(0);
      await this.showOutro();
      port.renderer.clear();
      return player.ship;
    }
    async showDemo() {
      const {port, player, sea} = this;
      sea.start(0.1);
      await sleep(5e3);
      let key = await this.showTutorial("<strong>Ahoy an' ye be welcome to the Rogue Sea!</strong> \u{1F99C}", "Press <kbd>Enter</kbd> to learn about this game. If you are an experienced pirate, you can press <kbd>Esc</kbd> to skip the tutorial and start playing right away.");
      sea.stop();
      let aside = document.querySelector("aside");
      if (key == "Escape") {
        aside.classList.remove("narrow");
        port.sync();
        return false;
      } else {
        aside.classList.add("transition");
        aside.classList.remove("narrow");
        await port.panAndZoomTo(player.ship.position);
        return true;
      }
    }
    async showIntro() {
      const {difficulty, port, player} = this;
      port.renderer.center = player.ship.position;
      player.ship.captain = player;
      switch (difficulty) {
        case 0:
          await this.showTutorial(`This is yer ship, the ${player.ship.name}. Be not she nice?

Let's get to learnin' the sailin' then!`);
          newline();
          text("Movement: <kbd>&larr;</kbd> <kbd>&uarr;</kbd> <kbd>&rarr;</kbd> / <kbd>A</kbd> <kbd>W</kbd> <kbd>D</kbd> / <kbd>H</kbd> <kbd>K</kbd> <kbd>L</kbd>");
          await this.showTutorial(`Use <kbd>&larr;</kbd> <kbd>&uarr;</kbd> <kbd>&rarr;</kbd> or <kbd>A</kbd> <kbd>W</kbd> <kbd>D</kbd> keys to move yer ship around.<br/>Ye can use <kbd>H</kbd> <kbd>K</kbd> <kbd>L</kbd> keys as well, if ye be that kind of pirate.`);
          await this.showTutorial(`It be not possible to go backwards! So take jolly care not to get stuck. If ye get stuck, ye be cursed!`);
          newline();
          text("Wait: <kbd>Space</kbd> / <kbd>Enter</kbd> / <kbd>.</kbd>");
          await this.showTutorial(`Skippin' a turn might be useful. Ye can wait by hittin' <kbd>Space</kbd> or <kbd>Enter</kbd> or <kbd>.</kbd> key.`);
          newline();
          text("Zoom: <kbd>&minus;</kbd> / <kbd>&plus;</kbd>");
          await this.showTutorial(`Finally, ye can change the map size usin' the <kbd>&minus;</kbd> and <kbd>&plus;</kbd> keys.`);
          await this.targetFound();
          break;
        case 1:
          await this.showTutorial(`From now on, ye be on yer own! Start with this here small ship an' collect ${COCONUTS} coconuts before movin' to a bigger sea.`);
          await this.targetFound();
          await this.showTutorial(`A coconut island be always shown as yer target to aid with navigation. Good luck, matey!`);
          break;
        case 2:
          await this.targetFound();
          await this.showTutorial(`Ye 'ave earned a middle-sized ship. She 'as more firepower, so do not be afraid to take on them other ships around. Yer goal be again to gather ${COCONUTS} coconuts.`);
          break;
        case 3:
          await this.targetFound();
          await this.showTutorial(`This here be the biggest boat that there sailed these seas. Show yer piratey skills an' try to loot as much <span class='gold'>gold</span> as possible. The game will end once ye reach ${COCONUTS} coconuts.`);
          break;
      }
    }
    async showOutro() {
      const {player, difficulty} = this;
      const endNote = "Press <kbd>Enter</kbd> to reload the game and try again";
      if (!player.ship.alive) {
        return this.showTutorial(`<strong>Scurvy! Yer ship been sent to Davy Jones' locker!</strong>

Ye managed to loot <span class='gold'>${player.ship.gold} gold</span> in yer pirate career.`, endNote);
      }
      switch (difficulty) {
        case 0:
          await this.showTutorial("Nice work, yer training is complete. Ye can start plain' the regular game now.");
          break;
        case 1:
          await this.showTutorial("Ye've proven yerself in this here small sea. Time to go lookin' fer a bigger one&hellip;");
          break;
        case 2:
          await this.showTutorial("All coconuts collected! Ye be truly gettin' into the pirate's way o' life.");
          break;
        case 3:
          await this.showTutorial(`<strong>Congratulations, matey!</strong>

Ye survived and completed the game, lootin' <span class='gold'>${player.ship.gold} gold</span> from other ships! Good luck in yer feature voyages.`, endNote);
          break;
      }
    }
    async showTutorialStep(step) {
      const {player, sea} = this;
      switch (step) {
        case "repair":
          {
            let island = sea.islands.filter((i) => i.type == "repair").random();
            player.target = island;
            await this.showTutorial(`This part o' the sea is peaceful, but yer ship has taken some damage and needs fixin'.

A carpenter lives at <strong>${island.name}</strong>, sail there an' pay 'em a visit.`);
          }
          break;
        case "cannonballs":
          {
            await this.showTutorial(`Now she be lookin' like new! Pay attention to islands where ye can repair yer ship. Repaired ships can take more poundin' by enemy cannons. 

Speakin' of cannons, let's check them out now, shall we?`);
            newline();
            text("Cannons: <kbd>number</kbd> of a ship's cannon");
            await this.showTutorial(`Yer ship has cannons represented by a number. Bigger ships 've more cannons. Ye can shoot those by pressin' a number key, but it won't work without cannonballs!`);
            let island = sea.islands.filter((i) => i.type == "cannonballs").random();
            player.target = island;
            await this.showTutorial(`To load more cannonballs, ye need to visit an island with a weaponsmith. <strong>${island.name}</strong> would be a jolly place to go now.`);
          }
          break;
        case "coconut":
          {
            await this.showTutorial(`Cannons be loaded, arrr! Ye can reload every time ye arrive to a cannonball island, but remember that bigger ships can 'old more cannonballs.`);
            await this.showTutorial(`Fightin' other ships be a life of a true pirate! Ye can loot cannonbals or even <span class='gold'>gold</span> from a sunken ship. Just take care ye do not end at Davy Jones' Locker!`);
            let island = sea.islands.filter((i) => i.type == "coconut").random();
            player.target = island;
            await this.showTutorial(`Ye can always make a fortune by hoardin' coconuts. Try goin' fer one to <strong>${island.name}</strong> now.`);
          }
          break;
      }
    }
    async showTutorial(text2, note) {
      let node2 = document.createElement("div");
      node2.id = "tutorial";
      node2.innerHTML = text2.replace(/\n/g, "<br/>") + `<br/><br/><em>${note || "Press <kbd>Enter</kbd> to continue"}</em>`;
      node2.style.opacity = "0";
      this.port.parent.appendChild(node2);
      await sleep(1);
      node2.style.opacity = "1";
      let keys = ["Enter"];
      if (note) {
        keys.push("Escape");
      }
      let key = await waitFor(...keys);
      node2.remove();
      return key;
    }
  };
  var level_default = Level;
  function populate(sea, difficulty) {
    let R = 70 + difficulty * 10;
    let islandCount = 6 + difficulty * 2;
    createIslands(R, islandCount).forEach((island) => sea.add(island));
    let islands = sea.islands.slice();
    islands.pop().type = "cannonballs";
    islands.pop().type = "cannonballs";
    islands.pop().type = "repair";
    islands.pop().type = "repair";
    let isStarting;
    if (difficulty == 0) {
      isStarting = (i) => i.type == "coconut";
    } else {
      isStarting = (i) => i.type != "coconut";
    }
    islands = sea.islands.filter(isStarting).sort((a, b) => {
      let da = a.position.norm();
      let db = b.position.norm();
      return db - da;
    });
    let pisland = islands.shift();
    let size = Math.max(difficulty - 1, 0);
    let pship = create({size, pc: true});
    if (difficulty == 0) {
      pship.cannonballs = 0;
      pship.hp >>= 1;
    }
    sea.positionNear(pship, pisland.position);
    sea.add(pship);
    islands = sea.islands.filter((i) => i != pisland).shuffle();
    let otherShips = 3 + difficulty;
    let corsairCount = difficulty;
    for (let i = 0; i < otherShips; i++) {
      let sizes = [0, 1];
      if (difficulty > 1) {
        sizes.push(2);
      }
      let size2 = sizes.random();
      let ship = create({size: size2, pc: false});
      sea.positionNear(ship, islands.shift().position);
      sea.add(ship);
      let personality = i < corsairCount ? "corsair" : "merchant";
      ship.captain = new captain_default(ship, personality);
    }
  }
  function createIslands(R, islandCount) {
    const D2R = Math.PI / 180;
    let positions = [];
    for (let r2 of [R * 0.45, R]) {
      let step = 3e3 / r2;
      for (let a = r2; a < 360 + r2; a += step) {
        positions.push([
          Math.round(r2 * Math.cos(a * D2R)) + offset(),
          Math.round(r2 * Math.sin(a * D2R)) + offset()
        ]);
      }
    }
    positions = positions.shuffle();
    let islands = [];
    while (islandCount-- > 0) {
      let island = new island_default();
      island.position = positions.shift();
      islands.push(island);
    }
    return islands;
  }
  function offset() {
    return Math.floor(5 * (Math.random() - 0.5));
  }

  // src/index.ts
  async function init4() {
    await init();
    const main = document.querySelector("main");
    let port = port_default.smallestTiles(main, palette);
    await init2(port.renderer);
    await waitFor("Enter");
    const about = document.querySelector("#about");
    const fadeOut = 3e3;
    about.style.setProperty("transition", `opacity ${fadeOut}ms`);
    about.style.opacity = "0";
    sleep(fadeOut).then(() => about.remove());
    start();
    window.addEventListener("keydown", (e) => {
      switch (e.key) {
        case "+":
          port.adjustTileSize(1);
          break;
        case "-":
          port.adjustTileSize(-1);
          break;
      }
    });
    let gold = 0;
    for (let i = 0; i <= 3; i++) {
      let level = new level_default(i, gold, port);
      let ship = await level.play();
      if (ship.alive) {
        gold = ship.gold;
      } else {
        break;
      }
    }
    location.reload();
  }
  init4();
})();
