import { Matrix } from '@/classes/matrix';
import { WebGLCustomRenderingContext } from '@/classes/webgl-custom-rendering-context';
import fragmentShaderSource from '@/shaders/image-canvas.frag?raw';
import vertexShaderSource from '@/shaders/image-canvas.vert?raw';

export class ImageCanvas {
    readonly canvas: HTMLCanvasElement;
    readonly renderer: WebGLCustomRenderingContext;
    private image: HTMLImageElement;
    private program: WebGLProgram;
    private texture: WebGLTexture | null = null;
    private textureSmoothing: boolean = false;

    private _zoomFactor: number = 1;
    private _rotationAngle: number = 0;
    private _xOffset: number = 0;
    private _yOffset: number = 0;

    constructor(canvas: HTMLCanvasElement, image: HTMLImageElement) {
        this.canvas = canvas;
        this.renderer = new WebGLCustomRenderingContext(canvas);
        new ResizeObserver((entries) => {
            for (const entry of entries) {
                const canvas = entry.target as HTMLCanvasElement;
                [canvas.width, canvas.height] = getActualCanvasSize(canvas);
                this.draw();
            }
        }).observe(this.canvas);

        this.image = image;
        this.program = this.renderer.makeProgram(ImageCanvas.vertexShader, ImageCanvas.fragmentShader);
        // NOTE: Binding vertices array with arbitrary values before using program removes the WebGL warning about drawing without vertex attrib 0 array enabled on OpenGL platforms.
        this.updateVerticesAttribute(new Float32Array([-1, -1, -1, 1, 1, 1, -1, -1, 1, 1, 1, -1]));
        this.gl.useProgram(this.program);
        this.loadImage();
    }

    static async fromImage(canvas: HTMLCanvasElement, image_src: string | URL): Promise<ImageCanvas> {
        const image = await loadImage(image_src);
        return new ImageCanvas(canvas, image);
    }

    get gl() {
        return this.renderer.context;
    }

    get zoomFactor() {
        return this._zoomFactor;
    }

    set zoomFactor(value: number) {
        this._zoomFactor = value;
        this.draw();
    }

    get xOffset() {
        return this._xOffset;
    }

    set xOffset(value: number) {
        this._xOffset = value;
        this.draw();
    }

    get yOffset() {
        return this._yOffset;
    }

    set yOffset(value: number) {
        this._yOffset = value;
        this.draw();
    }

    get rotationAngle() {
        return this._rotationAngle;
    }

    set rotationAngle(value: number) {
        if (Math.abs(value % (2 * Math.PI)) <= Number.EPSILON) {
            this._rotationAngle = 0;
        } else {
            this._rotationAngle = value % (2 * Math.PI);
        }
        this.draw();
    }

    draw() {
        this.updateMatrixUniform();
        this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
        this.gl.clearColor(0.9, 0.9, 0.92, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }

    resetView() {
        this.zoomFactor = 1;
        this.rotationAngle = 0;
        this.xOffset = 0;
        this.yOffset = 0;
    }

    zoomIn() {
        this.zoomFactor *= 1.03;
    }

    zoomOut() {
        this.zoomFactor *= 0.97;
    }

    getZoomedOffset(offset: number): number {
        return offset / this.zoomFactor;
    }

    rotateClockwise() {
        this.rotationAngle += Math.PI / 2;
    }

    rotateAntiClockwise() {
        this.rotationAngle -= Math.PI / 2;
    }

    moveUp() {
        this.yOffset -= this.getZoomedOffset(0.04);
    }

    moveDown() {
        this.yOffset += this.getZoomedOffset(0.04);
    }

    moveLeft() {
        this.xOffset += this.getZoomedOffset(0.04);
    }

    moveRight() {
        this.xOffset -= this.getZoomedOffset(0.04);
    }

    toggleSmoothing() {
        this.textureSmoothing = !this.textureSmoothing;
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.updateTextureFilteringParameters(this.textureSmoothing);
        this.draw();
    }

    private static get vertexShader(): string {
        return vertexShaderSource;
    }

    private static get fragmentShader(): string {
        return fragmentShaderSource;
    }

    private get imageAspectRatio() {
        return this.image.height / this.image.width;
    }

    private get imageToCanvasWidthRatio() {
        return this.image.width / this.canvas.clientWidth;
    }

    private get imageToCanvasHeightRatio() {
        return this.image.height / this.canvas.clientHeight;
    }

    private get maximumTextureSize() {
        return this.gl.getParameter(this.gl.MAX_TEXTURE_SIZE);
    }

    private get modelViewProjectionMatrix(): number[] {
        const modelMatrix = Matrix.identity(4);
        const viewMatrix = Matrix.multiplyArray([
            Matrix.scaling(this.zoomFactor),
            Matrix.translation(this.xOffset, -this.yOffset, 0),
            Matrix.rotationAroundZ(this.rotationAngle),
        ]);

        // This is needed for when canvas is resized and to display image in real size.
        const projectionMatrix = new Matrix([
            [this.imageToCanvasWidthRatio, 0, 0],
            // I have no idea why this also needs the aspect ratio of the image to work correctly.
            [0, -this.imageToCanvasHeightRatio / this.imageAspectRatio, 0],
            [0, 0, 1],
        ]).toHomogenous();

        return Matrix.multiplyArray([projectionMatrix, viewMatrix, modelMatrix]).transpose().data.flat();
    }

    private loadImage() {
        const imageQuadWidth = 1;
        const imageQuadHeight = this.imageAspectRatio;

        const imageVertices = new Float32Array(
            [
                [-imageQuadWidth, -imageQuadHeight],
                [-imageQuadWidth, +imageQuadHeight],
                [+imageQuadWidth, +imageQuadHeight],
                [-imageQuadWidth, -imageQuadHeight],
                [+imageQuadWidth, +imageQuadHeight],
                [+imageQuadWidth, -imageQuadHeight],
            ].flat(),
        );

        this.updateVerticesAttribute(imageVertices);
        this.gl.uniform1f(this.gl.getUniformLocation(this.program, 'image_aspect_ratio'), this.imageAspectRatio);

        this.texture = this.gl.createTexture();
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.image);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.updateTextureFilteringParameters(this.textureSmoothing);
        this.draw();
    }

    private updateVerticesAttribute(vertices: Float32Array) {
        const vertexBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW);

        const positionVecPointer = this.gl.getAttribLocation(this.program, 'position');
        this.gl.vertexAttribPointer(positionVecPointer, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.enableVertexAttribArray(positionVecPointer);
    }

    private updateMatrixUniform() {
        this.gl.uniformMatrix4fv(
            this.gl.getUniformLocation(this.program, 'model_view_projection_matrix'),
            false,
            this.modelViewProjectionMatrix,
        );
    }

    private updateTextureFilteringParameters(enableSmoothing: boolean = false) {
        const filteringMethod = enableSmoothing ? this.gl.LINEAR : this.gl.NEAREST;
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, filteringMethod);
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

function getActualCanvasSize(canvas: HTMLCanvasElement): [width: number, height: number] {
    const dpr = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    return [Math.round(width * dpr), Math.round(height * dpr)];
}
