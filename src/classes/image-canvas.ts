import { WebGLCustomRenderingContext } from '@/classes/webgl-custom-rendering-context';
import vertexShaderSource from '@/shaders/image-canvas.vert?raw';
import fragmentShaderSource from '@/shaders/image-canvas.frag?raw';

export class ImageCanvas {
    readonly canvas: HTMLCanvasElement;
    readonly gl: WebGLCustomRenderingContext;
    private image: HTMLImageElement | null = null;
    private program: WebGLProgram;

    zoomFactor: number = 1;
    rotationAngle: number = 0;
    relativeOffset: { x: number; y: number } = { x: 0, y: 0 };

    static get vertexShader(): string {
        return vertexShaderSource;
    }

    static get fragmentShader(): string {
        return fragmentShaderSource;
    }

    // static get modelViewProjectionMatrix() {}

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.gl = new WebGLCustomRenderingContext(canvas);
        new ResizeObserver((entries) => {
            for (const entry of entries) {
                resizeCanvasToDisplaySize(entry.target as HTMLCanvasElement);
                this.draw();
            }
        }).observe(this.canvas);

        this.program = this.gl.makeShaders(ImageCanvas.vertexShader, ImageCanvas.fragmentShader);
        const gl = this.gl.context;

        const vertexBuffer = gl.createBuffer();
        const vertices = new Float32Array([-1, -1, -1, 1, 1, 1, -1, -1, 1, 1, 1, -1]);
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        const positionVecPointer = gl.getAttribLocation(this.program, 'position');
        gl.vertexAttribPointer(positionVecPointer, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionVecPointer);
    }

    async loadImage(src: string | URL) {
        this.image = await loadImage(src);

        const gl = this.gl.context;
        const texture = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        const resolutionVecPointer = gl.getUniformLocation(this.program, 'iResolution');
        console.log(this.image.height, this.image.width);
        gl.uniform2fv(resolutionVecPointer, [this.image.width, this.image.height]);

        this.draw();
    }

    draw() {
        const gl = this.gl.context;
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clearColor(1.0, 0.8, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
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
