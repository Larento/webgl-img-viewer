export class ImageCanvas {
    readonly canvas: HTMLCanvasElement;
    readonly gl: WebGLCustomRenderingContext;
    private image: HTMLImageElement | null = null;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.gl = new WebGLCustomRenderingContext(canvas);
        const canvasResizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                resizeCanvasToDisplaySize(entry.target as HTMLCanvasElement);
                this.draw();
            }
        });
        canvasResizeObserver.observe(canvas);
    }

    async loadImage(src: string | URL) {
        this.image = await loadImage(src);
        this.draw();
    }

    draw() {
        const vertexShader = `
            attribute vec2 position;
            varying vec2 texCoords;
            void main() {
                texCoords = (position + 1.0) / 2.0;
                texCoords.y = 0.5 - texCoords.y;
                gl_Position = vec4(position, 0, 1.0);
           }
        `;

        const fragmentShader = `
            precision highp float;
            varying vec2 texCoords;
            uniform sampler2D texSampler;
            void main() {
                gl_FragColor = texture2D(texSampler, texCoords);
            }
        `;

        if (this.image) {
            const gl = this.gl.context;
            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
            gl.clearColor(1.0, 0.8, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT);

            const program = this.gl.makeShaders(vertexShader, fragmentShader);

            const vertexBuffer = gl.createBuffer();
            const vertices = new Float32Array([-1, -1, -1, 1, 1, 1, -1, -1, 1, 1, 1, -1]);
            gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
            gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

            const positionVecPointer = gl.getAttribLocation(program, 'position');
            gl.vertexAttribPointer(positionVecPointer, 2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(positionVecPointer);

            const texture = gl.createTexture();
            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }
    }
}

async function loadImage(src: string | URL): Promise<HTMLImageElement> {
    const image = new Image();
    image.src = src.toString();
    return new Promise((resolve, reject) => {
        image.onload = (e) => resolve(e.target as HTMLImageElement);
        image.onerror = (e) => reject(e);
    });
}

function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement) {
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
}

class WebGLCustomRenderingContext {
    context: WebGLRenderingContext;

    constructor(canvas: HTMLCanvasElement) {
        const context = canvas.getContext('webgl');
        if (!context) {
            throw new WebGLGenericError(
                'Unable to initialize WebGL. Your browser or machine may not support it.',
            );
        }
        this.context = context;
    }

    makeShaders(vertexSource: string, fragmentSource: string) {
        const vertexShader = WebGLShaderCreator.load(
            this.context,
            vertexSource,
            WebGLRenderingContext.VERTEX_SHADER,
        );
        const fragmentShader = WebGLShaderCreator.load(
            this.context,
            fragmentSource,
            WebGLRenderingContext.FRAGMENT_SHADER,
        );
        const shaderProgram = this.context.createProgram();

        if (!shaderProgram) {
            throw new WebGLGenericError('Could not create shader program.');
        }

        this.context.attachShader(shaderProgram, vertexShader);
        this.context.attachShader(shaderProgram, fragmentShader);
        this.context.linkProgram(shaderProgram);
        this.context.useProgram(shaderProgram);

        return shaderProgram;
    }
}

type WebGLShaderType =
    | WebGLRenderingContext['VERTEX_SHADER']
    | WebGLRenderingContext['FRAGMENT_SHADER'];

class WebGLShaderCreator {
    static load(context: WebGLRenderingContext, source: string, type: WebGLShaderType) {
        const shader = context.createShader(type);
        if (!shader) {
            throw new WebGLGenericError('Error creating shader.');
        }

        context.shaderSource(shader, source);
        context.compileShader(shader);

        if (!context.getShaderParameter(shader, WebGLRenderingContext.COMPILE_STATUS)) {
            context.deleteShader(shader);
            throw new WebGLGenericError(
                `An error occurred compiling the shaders: ${context.getShaderInfoLog(shader)}`,
            );
        }

        return shader;
    }
}

class WebGLGenericError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'WebGlGenericError';
    }
}
