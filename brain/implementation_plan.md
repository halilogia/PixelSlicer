# Multiple Image Grid & Color Picker Enhancement

This plan adds grid-based image stitching for multiple uploads, a modern color picker, and an eyedropper tool for easier background removal.

## User Review Required

> [!IMPORTANT]
> - Multiple images will now be stitched into a **8-column grid** (instead of a single wide strip) to prevent horizontal overflow in the editor.
> - The **Eyedropper tool** will allow you to click anywhere on the canvas to select the background color you want to remove.

## Proposed Changes

### [Presentation Layer]

#### [MODIFY] [App.tsx](file:///home/halile/Masa%C3%BCst%C3%BC/GitHub/Done/PixelSlicer/src/App.tsx)
- **Stitching Logic**: Update `handleImageUpload` to calculate grid dimensions (8 columns max) and draw images in rows.
- **Eyedropper State**: Add a React state `isEyedropperActive`.
- **Canvas Interaction**: Update `handleCanvasClick` to detect eyedropper mode and pick color from the clicked pixel using `ctx.getImageData`.
- **UI Refresh**:
  - Replace RGB number inputs with `<input type="color">`.
  - Add "Eyedropper" button with icon in the "Effects" section.

#### [MODIFY] [translations.ts](file:///home/halile/Masa%C3%BCst%C3%BC/GitHub/Done/PixelSlicer/src/i18n/translations.ts)
- Add entries for "Eyedropper" and "Pick color from image".

## Open Questions

- Should the number of columns for stitching be configurable, or is a fixed "8-column" grid reasonable as a default?

## Verification Plan

### Manual Verification
1. Upload 10+ images: Verify they are arranged in rows (8 per row).
2. Use Color Picker: Verify it updates the background removal color.
3. Use Eyedropper: Verify clicking on the canvas picks the correct color and updates the UI.
