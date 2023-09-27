precision highp float;
varying vec2 tex_coords;
uniform sampler2D tex_sampler;

void main() {
    gl_FragColor = texture2D(tex_sampler, tex_coords);
}