# Home Grown crop icons

45 icons, one per crop the API scores. Each is a 64 x 64 SVG in the app's style: dark green outline (#1B6A24), flat fills, standing on a ground line near the bottom.

`crop-icons.json` maps each crop name exactly as the API returns it to its file, for example `"Corn/Maize": "corn-maize.svg"`. Fall back to `sprout.svg` for any name not in the map.

Where they are used in the design:
- Crop detail header: the icon at 72 px inside a 96 px pale circle (#F2FEF0, 1px border rgba(27,106,36,0.25)). On mobile, 52 px inside 68 px.
- "Also good here" chips on crop detail: 26 px before the crop name.

The score dots in the results list stay as they are: they show how well a crop fits. If icons go into the list later, put them next to the crop name, not in place of the dot.

The SVGs use hex colours rather than CSS variables, so they work as plain images. They are decorative: give them alt="" or aria-hidden, since the crop name is always next to them.
