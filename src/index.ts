import { WebGLCustomRenderingContext } from './canvas';

async function loadImage(src: string | URL): Promise<HTMLImageElement> {
    const image = new Image();
    image.src = src.toString();
    return new Promise((resolve, reject) => {
        image.onload = (e) => resolve(e.target as HTMLImageElement);
        image.onerror = (e) => reject(e);
    });
}

(async () => {
    const canvas: HTMLCanvasElement | null = document.querySelector('#context');
    if (canvas) {
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

        const vertices = new Float32Array([-1, -1, -1, 1, 1, 1, -1, -1, 1, 1, 1, -1]);
        const image = await loadImage('images/giraffe-bread.jpg');

        const gl = new WebGLCustomRenderingContext(canvas);
        gl.context.viewport(0, 0, gl.context.drawingBufferWidth, gl.context.drawingBufferHeight);
        gl.context.clearColor(1.0, 0.8, 0.0, 1.0);
        gl.context.clear(gl.context.COLOR_BUFFER_BIT);

        const program = gl.makeShaders(vertexShader, fragmentShader);

        const vertexBuffer = gl.context.createBuffer();
        gl.context.bindBuffer(gl.context.ARRAY_BUFFER, vertexBuffer);
        gl.context.bufferData(gl.context.ARRAY_BUFFER, vertices, gl.context.STATIC_DRAW);

        const positionVecPointer = gl.context.getAttribLocation(program, 'position');
        gl.context.vertexAttribPointer(positionVecPointer, 2, gl.context.FLOAT, false, 0, 0);
        gl.context.enableVertexAttribArray(positionVecPointer);

        const texture = gl.context.createTexture();
        gl.context.activeTexture(gl.context.TEXTURE0);
        gl.context.bindTexture(gl.context.TEXTURE_2D, texture);
        gl.context.texImage2D(
            gl.context.TEXTURE_2D,
            0,
            gl.context.RGBA,
            gl.context.RGBA,
            gl.context.UNSIGNED_BYTE,
            image,
        );
        gl.context.texParameteri(
            gl.context.TEXTURE_2D,
            gl.context.TEXTURE_WRAP_S,
            gl.context.CLAMP_TO_EDGE,
        );
        gl.context.texParameteri(
            gl.context.TEXTURE_2D,
            gl.context.TEXTURE_WRAP_T,
            gl.context.CLAMP_TO_EDGE,
        );
        gl.context.texParameteri(
            gl.context.TEXTURE_2D,
            gl.context.TEXTURE_MIN_FILTER,
            gl.context.LINEAR,
        );
        gl.context.texParameteri(
            gl.context.TEXTURE_2D,
            gl.context.TEXTURE_MAG_FILTER,
            gl.context.LINEAR,
        );

        gl.context.drawArrays(gl.context.TRIANGLES, 0, 6);
    }
})();
