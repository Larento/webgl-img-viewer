import { Matrix } from '@/classes/matrix';
import { WebGLCustomRenderingContext } from '@/classes/webgl-custom-rendering-context';
import vertexShaderSource from '@/shaders/image-canvas.vert?raw';
import fragmentShaderSource from '@/shaders/image-canvas.frag?raw';

export class ImageCanvas {
    readonly canvas: HTMLCanvasElement;
    readonly renderer: WebGLCustomRenderingContext;
    private image: HTMLImageElement | null = null;
    private program: WebGLProgram;

    zoomFactor: number = 1;
    rotationAngle: number = 0;
    xOffset: number = 0;
    yOffset: number = 0;

    get gl() {
        return this.renderer.context;
    }

    static get vertexShader(): string {
        return vertexShaderSource;
    }

    static get fragmentShader(): string {
        return fragmentShaderSource;
    }

    get modelViewProjectionMatrix(): number[] {
        const modelMatrix = Matrix.identity(4);
        const viewMatrix = Matrix.multiplyArray([
            Matrix.translation(this.xOffset, this.yOffset, 0),
            Matrix.scaling(this.zoomFactor),
            Matrix.rotation(this.rotationAngle),
        ]);
        const projectionMatrix = new Matrix([
            [1, 0, 0],
            [0, -1, 0],
            [0, 0, 1],
        ]).toHomogenous();
        return Matrix.multiplyArray([projectionMatrix, viewMatrix, modelMatrix])
            .transpose()
            .data.flat();
    }

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.renderer = new WebGLCustomRenderingContext(canvas);
        new ResizeObserver((entries) => {
            for (const entry of entries) {
                resizeCanvasToDisplaySize(entry.target as HTMLCanvasElement);
                this.draw();
            }
        }).observe(this.canvas);

        this.program = this.renderer.makeShaders(
            ImageCanvas.vertexShader,
            ImageCanvas.fragmentShader,
        );
    }

    zoomIn() {
        this.zoomFactor *= 1.02;
        this.draw();
    }

    zoomOut() {
        this.zoomFactor *= 0.98;
        this.draw();
    }

    rotateClockwise() {
        this.rotationAngle += 0.04;
        this.draw();
    }

    rotateAntiClockwise() {
        this.rotationAngle -= 0.04;
        this.draw();
    }

    moveUp() {
        this.yOffset -= 0.01;
        this.draw();
    }

    moveDown() {
        this.yOffset += 0.01;
        this.draw();
    }

    moveLeft() {
        this.xOffset -= 0.01;
        this.draw();
    }

    moveRight() {
        this.xOffset += 0.01;
        this.draw();
    }

    updateMatrixUniform() {
        this.gl.uniformMatrix4fv(
            this.gl.getUniformLocation(this.program, 'model_view_projection_matrix'),
            false,
            this.modelViewProjectionMatrix,
        );
    }

    async loadImage(src: string | URL) {
        this.image = await loadImage(src);

        const aspectRatio = this.image.width / this.image.height;
        const imageVertices = new Float32Array(
            [
                [-1, -aspectRatio],
                [-1, +aspectRatio],
                [+1, +aspectRatio],
                [-1, -aspectRatio],
                [+1, +aspectRatio],
                [+1, -aspectRatio],
            ].flat(),
        );
        console.log(imageVertices);

        const vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, imageVertices, this.gl.STATIC_DRAW);

        const positionVecPointer = this.gl.getAttribLocation(this.program, 'position');
        this.gl.vertexAttribPointer(positionVecPointer, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(positionVecPointer);

        // const resolutionVecPointer = this.gl.getUniformLocation(this.program, 'iResolution');
        // this.gl.uniform2fv(resolutionVecPointer, [this.image.width, this.image.height]);

        const texture = this.gl.createTexture();
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
        this.gl.texImage2D(
            this.gl.TEXTURE_2D,
            0,
            this.gl.RGBA,
            this.gl.RGBA,
            this.gl.UNSIGNED_BYTE,
            this.image,
        );
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

        this.draw();
    }

    draw() {
        this.updateMatrixUniform();
        this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
        this.gl.clearColor(1.0, 0.8, 0.0, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
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
