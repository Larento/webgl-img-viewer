attribute vec2 position;
uniform mat4 model_view_projection_matrix;
uniform float image_aspect_ratio;
varying vec2 tex_coords;

void main() {
    tex_coords = (position / vec2(1, image_aspect_ratio) + 1.0) / 2.0;
    gl_Position = model_view_projection_matrix * vec4(position, 0, 1.0);
}