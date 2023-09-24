class WebGLGenericError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'WebGlGenericError';
    }
}

type WebGLShaderType =
    | WebGLRenderingContext['VERTEX_SHADER']
    | WebGLRenderingContext['FRAGMENT_SHADER'];

class WebGLShaderCreator {
    context: WebGLRenderingContext;

    constructor(context: WebGLRenderingContext) {
        this.context = context;
    }

    load(source: string, type: WebGLShaderType) {
        const shader = this.context.createShader(type);
        if (!shader) {
            throw new WebGLGenericError('Error creating shader.');
        }

        this.context.shaderSource(shader, source);
        this.context.compileShader(shader);

        if (!this.context.getShaderParameter(shader, WebGLRenderingContext.COMPILE_STATUS)) {
            this.context.deleteShader(shader);
            throw new WebGLGenericError(
                `An error occurred compiling the shaders: ${this.context.getShaderInfoLog(shader)}`,
            );
        }

        return shader;
    }
}

class WrappedWebGLRenderingContext extends WebGLRenderingContext {
    constructor(canvas: HTMLCanvasElement) {
        try {
            super();
        } catch {}

        const context = canvas.getContext('webgl');
        if (!context) {
            throw new WebGLGenericError(
                'Unable to initialize WebGL. Your browser or machine may not support it.',
            );
        }
        return context;
    }
}

export class WebGLCustomRenderingContext extends WrappedWebGLRenderingContext {
    shaderCreator: WebGLShaderCreator;

    constructor(canvas: HTMLCanvasElement) {
        super(canvas);
        this.shaderCreator = new WebGLShaderCreator(this);
    }

    makeShaders(vertexSource: string, fragmentSource: string) {
        const vertexShader = this.shaderCreator.load(
            vertexSource,
            WebGLRenderingContext.VERTEX_SHADER,
        );
        const fragmentShader = this.shaderCreator.load(
            fragmentSource,
            WebGLRenderingContext.FRAGMENT_SHADER,
        );
        const shaderProgram = this.createProgram();

        if (!shaderProgram) {
            throw new WebGLGenericError('Could not create shader program.');
        }

        this.attachShader(shaderProgram, vertexShader);
        this.attachShader(shaderProgram, fragmentShader);
        this.linkProgram(shaderProgram);
        this.useProgram(shaderProgram);

        return shaderProgram;
    }
}

// function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement) {
//     // Lookup the size the browser is displaying the canvas in CSS pixels.
//     const dpr = window.devicePixelRatio || 1;
//     const { width, height } = canvas.getBoundingClientRect();
//     const displayWidth = Math.round(width * dpr);
//     const displayHeight = Math.round(height * dpr);

//     // Check if the canvas is not the same size.
//     const needResize = canvas.width != displayWidth || canvas.height != displayHeight;

//     if (needResize) {
//         // Make the canvas the same size
//         canvas.width = displayWidth;
//         canvas.height = displayHeight;
//     }

//     return needResize;
// }

// function onCanvasResize(entries) {
//     for (const entry of entries) {
//         resizeCanvasToDisplaySize(entry.target);
//     }
// }

// export function main() {
//     /** @type {HTMLCanvasElement} */
//     const canvas = document.querySelector('#context');
//     const canvasResizeObserver = new ResizeObserver(onCanvasResize);
//     resizeCanvasToDisplaySize(canvas);
//     canvasResizeObserver.observe(canvas);

//     const gl = canvas.getContext('webgl');
//     gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
//     gl.clearColor(1.0, 0.8, 0.0, 1.0);
//     gl.clear(gl.COLOR_BUFFER_BIT);

//     const vertShaderSource = `
//   attribute vec2 position;

//   varying vec2 texCoords;

//   void main() {
//     texCoords = (position + 1.0) / 2.0;
//     texCoords.y = 0.5 - texCoords.y;
//     gl_Position = vec4(position, 0, 1.0);
//   }
// `;

//     const fragShaderSource = `
//   precision highp float;

//   varying vec2 texCoords;

//   uniform sampler2D texSampler;

//   void main() {
//     gl_FragColor = texture2D(texSampler, texCoords);
//   }
// `;

//     const vertShader = gl.createShader(gl.VERTEX_SHADER);
//     const fragShader = gl.createShader(gl.FRAGMENT_SHADER);

//     gl.shaderSource(vertShader, vertShaderSource);
//     gl.shaderSource(fragShader, fragShaderSource);

//     gl.compileShader(vertShader);
//     gl.compileShader(fragShader);

//     const program = gl.createProgram();
//     gl.attachShader(program, vertShader);
//     gl.attachShader(program, fragShader);
//     gl.linkProgram(program);
//     gl.useProgram(program);

//     const vertices = new Float32Array([
//         -1, -1, -1, 1, 1, 1,

//         -1, -1, 1, 1, 1, -1,
//     ]);

//     const vertexBuffer = gl.createBuffer();
//     gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
//     gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

//     const positionVecPointer = gl.getAttribLocation(program, 'position');

//     gl.vertexAttribPointer(positionVecPointer, 2, gl.FLOAT, false, 0, 0);
//     gl.enableVertexAttribArray(positionVecPointer);

//     const texture = gl.createTexture();
//     gl.activeTexture(gl.TEXTURE0);
//     gl.bindTexture(gl.TEXTURE_2D, texture);
//     gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
//     gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

//     gl.drawArrays(gl.TRIANGLES, 0, 6);
// }
