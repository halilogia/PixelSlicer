AAA Quality Suggestions - Thumbnail & Rendering
The current thumbnail generation system works but can be improved to achieve "AAA" performance and feel.

1. Offscreen Rendering (Web Workers)
Current: Thumbnails are generated on the main thread during idle periods. Proposed: Use OffscreenCanvas in a Web Worker to offload all image processing. Benefit: Zero impact on the main thread, even with 100+ frames. UI remains 60fps at all times. Difficulty: Medium (Requires creating a Worker script and handling message passing).

2. Blob vs DataURL
Current: canvas.toDataURL() creates base64 strings. Proposed: Use canvas.toBlob() and URL.createObjectURL(). Benefit: Lower memory usage (Base64 is ~33% larger) and faster string handling. Difficulty: Low.

3. High-Fidelity Previews (VFX)
Current: Static thumbnails. Proposed: Add a subtle "shimmer" effect (skeleton screen) while thumbnails are loading, or a fade-in animation using Framer Motion when they appear. Benefit: Professional, premium feel. Difficulty: Low.

4. Hardware Acceleration (createImageBitmap)
Current: ctx.drawImage with HTMLImageElement. Proposed: Use createImageBitmap to decode the image in the background and draw the bitmap to the canvas. Benefit: Faster drawing and less jank during large sprite loads. Difficulty: Low.