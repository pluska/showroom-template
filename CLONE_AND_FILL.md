# How to Use This Template

This template is designed to help you create new showroom projects quickly. Follow these steps to set up a new project:

## 1. Clone and Install
Clone this repository and install dependencies:
```bash
npm install
```

## 2. Configure Project Identity
Open `src/config/config.ts` and update all the placeholders with your project's specific information:
- `appName`, `appDescription`, `domainName`
- `colors.main` (Your primary brand color)
- `company` and `buildingSocials` information

## 3. Set Up Environment Variables
Create a `.env.local` file in the root directory and add the following variable:
```bash
NEXT_PUBLIC_ASSET_BASE_URL=https://your-assets-storage-url.com
```
This URL should point to the folder containing your project's images and videos.

## 4. Fill Data Files
Update the following files in `src/data/` with your project data:
- `homepage.ts`: Update the hero section content and introduction slides.
- `buildingData.ts`: Define the building faces, background images, and transition videos.
- `floors.ts`: Define the floors, floor plans, and unit details (prices, status, SVG paths for highlights).
- `galleries.ts`: Add URLs for image galleries.
- `tours.ts`: Add URLs for 360 virtual tours.
- `locations.ts`: Define points of interest for the map.

## 5. Update Asset Manifest
Add all the asset paths that need to be preloaded to `src/data/asset-manifest.ts`. This ensures a smoother user experience as assets are loaded in the background.

## 6. Build and Deploy
Verify everything works locally:
```bash
npm run dev
```
When ready, build the project:
```bash
npm run build
```

---

### Tips for "Filling":
- **SVG Paths**: For unit highlights in `floors.ts`, you can use tools like Figma or Inkscape to get the `d` attribute of the path covering each unit on the floor plan.
- **Assets**: Ensure your videos are compressed for the web and images are in a modern format like WebP or optimized PNG/JPG.
- **Background Videos**: You can now add a `backgroundVideo` to each building face in `buildingData.ts` to make the exterior view feel more alive.
