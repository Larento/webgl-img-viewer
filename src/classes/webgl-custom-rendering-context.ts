export class WebGLCustomRenderingContext {
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
            const shaderInfoLog = context.getShaderInfoLog(shader);
            context.deleteShader(shader);
            throw new WebGLGenericError(
                `An error occurred compiling the shaders: ${shaderInfoLog}`,
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
