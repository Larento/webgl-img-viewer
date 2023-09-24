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
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clearColor(1.0, 0.8, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        const program = gl.makeShaders(vertexShader, fragmentShader);

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
})();
