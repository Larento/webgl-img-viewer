attribute vec2 position;
uniform mat4 model_view_projection_matrix;
varying vec2 tex_coords;

void main() {
    tex_coords = (position + 1.0) / 2.0;
    gl_Position = model_view_projection_matrix * vec4(position, 0, 1.0);
}