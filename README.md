# webgl-img-viewer

Image viewer using the WebGL API.

## Features

-   upload image from device
-   pan
-   zoom
-   rotate

## Main goals

-   better performance for scaling large images (8K and above) compared to regular `<img>` element
-   no use of external libraries or 3rd party graphics libraries like three.js

## Secondary goals

-   simplest architecture possible
-   code should be easily extractable into a library, when there is such a need

## Development

I'm using [Bun][link-bun] as a package manager together with [Vite][link-vite].

[link-bun]: https://bun.sh/
[link-vite]: https://vitejs.dev/
