precision highp float;
varying vec2 texCoords;
uniform sampler2D texSampler;

void main() {
    gl_FragColor = texture2D(texSampler, texCoords);
}