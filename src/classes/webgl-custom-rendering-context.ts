export class WebGl2CustomRenderingContext {
    context: WebGL2RenderingContext;

    constructor(canvas: HTMLCanvasElement) {
        const context = canvas.getContext('webgl2');
        if (!context) {
            throw new WebGlGenericError('Unable to initialize WebGL. Your browser or machine may not support it.');
        }
        this.context = context;
    }

    makeProgram(vertexSource: string, fragmentSource: string) {
        const vertexShader = WebGlShaderCreator.load(this.context, vertexSource, this.context.VERTEX_SHADER);
        const fragmentShader = WebGlShaderCreator.load(this.context, fragmentSource, this.context.FRAGMENT_SHADER);
        const shaderProgram = this.context.createProgram();

        if (!shaderProgram) {
            throw new WebGlGenericError('Could not create shader program.');
        }

        this.context.attachShader(shaderProgram, vertexShader);
        this.context.attachShader(shaderProgram, fragmentShader);
        this.context.linkProgram(shaderProgram);
        this.context.detachShader(shaderProgram, vertexShader);
        this.context.detachShader(shaderProgram, fragmentShader);

        return shaderProgram;
    }
}

type WebGl2ShaderType = WebGL2RenderingContext['VERTEX_SHADER'] | WebGL2RenderingContext['FRAGMENT_SHADER'];

class WebGlShaderCreator {
    static load(context: WebGL2RenderingContext, source: string, type: WebGl2ShaderType) {
        const shader = context.createShader(type);
        if (!shader) {
            throw new WebGlGenericError('Error creating shader.');
        }

        context.shaderSource(shader, source);
        context.compileShader(shader);

        if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
            const shaderInfoLog = context.getShaderInfoLog(shader);
            context.deleteShader(shader);
            throw new WebGlGenericError(`An error occurred compiling the shaders: ${shaderInfoLog}`);
        }

        return shader;
    }
}

class WebGlGenericError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'WebGlGenericError';
    }
}
