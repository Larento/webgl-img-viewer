function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement) {
    // Lookup the size the browser is displaying the canvas in CSS pixels.
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    const displayWidth = Math.round(width * dpr);
    const displayHeight = Math.round(height * dpr);

    // Check if the canvas is not the same size.
    const needResize = canvas.width != displayWidth || canvas.height != displayHeight;

    if (needResize) {
        // Make the canvas the same size
        canvas.width = displayWidth;
        canvas.height = displayHeight;
    }

    return needResize;
}

function onCanvasResize(entries) {
    for (const entry of entries) {
        resizeCanvasToDisplaySize(entry.target);
    }
}

export function main() {
    /** @type {HTMLCanvasElement} */
    const canvas = document.querySelector('#context');
    const canvasResizeObserver = new ResizeObserver(onCanvasResize);
    resizeCanvasToDisplaySize(canvas);
    canvasResizeObserver.observe(canvas);

    const gl = canvas.getContext('webgl');
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(1.0, 0.8, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const vertShaderSource = `
  attribute vec2 position;

  varying vec2 texCoords;

  void main() {
    texCoords = (position + 1.0) / 2.0;
    texCoords.y = 0.5 - texCoords.y;
    gl_Position = vec4(position, 0, 1.0);
  }
`;

    const fragShaderSource = `
  precision highp float;

  varying vec2 texCoords;

  uniform sampler2D texSampler;

  void main() {
    gl_FragColor = texture2D(texSampler, texCoords);
  }
`;

    const vertShader = gl.createShader(gl.VERTEX_SHADER);
    const fragShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertShader, vertShaderSource);
    gl.shaderSource(fragShader, fragShaderSource);

    gl.compileShader(vertShader);
    gl.compileShader(fragShader);

    const program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const vertices = new Float32Array([
        -1, -1, -1, 1, 1, 1,

        -1, -1, 1, 1, 1, -1,
    ]);

    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionVecPointer = gl.getAttribLocation(program, 'position');

    gl.vertexAttribPointer(positionVecPointer, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionVecPointer);

    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
}
