attribute vec2 position;
uniform vec2 iResolution;
varying vec2 texCoords;

void main() {
    texCoords = (position + 1.0) / 2.0;
    texCoords.y = 1.0 - texCoords.y;
    texCoords.x *= iResolution.x / iResolution.y;
    gl_Position = vec4(position, 0, 1.0);
}