# Codex Change Request — Portfolio Web

## Mandatory working-directory instruction

Work only inside this directory:

`D:\DESKTOP\Portfolio (Basic)\Portfolio Web New - Codex Test`

Do not edit, move, delete, overwrite, or rename anything inside the original directory:

`D:\DESKTOP\Portfolio (Basic)\Portfolio Web New`

Do not edit anything outside the Codex working directory unless explicitly approved by the user. Before changing files, verify that the active workspace is the safe copy shown above.

Read the existing code before editing. Preserve the current content, accessibility, CAT password gate, responsive behavior, and reduced-motion support unless a requirement below specifically changes them.

Important files to inspect first:

- `frontend/src/components/console/Console.tsx`
- `frontend/src/hooks/useConsole.ts`
- `frontend/src/components/lcd/LoadView.tsx`
- `frontend/src/components/stage/Stage.tsx`
- `frontend/src/styles/console.css`
- `frontend/src/styles/lcd.css`
- `frontend/src/styles/stage.css`
- `frontend/src/content/projects.ts`
- Existing block-rendering components under `frontend/src/components/blocks/`

## Requested changes

### 1. Fix the console screen reflection

Use this reference image:

`D:\DESKTOP\Portfolio (Basic)\Codex Image 16 Aug 2026, 19_25_41.png`

- Fix the strange current LCD reflection/highlight.
- Make the reflection subtle, centered, and aligned with the LCD.
- Remove the dark or black patch that interferes with the screen.
- Keep the amber LCD field and pixel grid visible.
- Do not obscure interface text or loading sprites.
- Verify desktop and mobile layouts.

### 2. Add control instructions beneath the console

Use this reference image:

`D:\DESKTOP\Portfolio (Basic)\Codex Image 16 Aug 2026, 19_25_54.png`

Add a centered instruction row underneath the console and above the existing “VIEW EVERYTHING AS ONE PAGE” link:

`▲▼ SELECT    ◀▶ CHANNEL    A OPEN    B BACK    START POWER`

Requirements:

- Use the existing monospace interface font.
- Match the compact, low-contrast appearance of the reference.
- Keep the instructions outside the console body.
- Allow clean wrapping on narrow screens.
- Do not add a physical SELECT button.

### 3. Fix the power LED

When the console is powered off:

- The green power LED must turn off completely.
- Remove all flashing, pulsing, and glow effects while powered off.
- When powered on, restore the small green lamp and subtle glow.
- Drive the styling from `state.power`.
- Update outdated comments and tests that say the lamp is always lit.

### 4. Animate the loading sprites

Create a reusable loading-sprite animation in `LoadView.tsx` or a small reusable component.

- Keep sprites pixelated with `image-rendering: pixelated`.
- Use CSS keyframes and/or a lightweight React component.
- Use stepped retro motion rather than smooth modern UI animation.
- Add a subtle pixel flicker, scanline reveal, scale-in, or frame-like movement.
- Do not distort the sprite.
- Do not add a heavy animation library.
- Show the final sprite immediately when `prefers-reduced-motion: reduce` is enabled.
- Make the animation reusable for every project sprite.

### 5. Remove the unwanted white loading flash

The loading completion currently creates an unwanted white flash behind the sprite.

- Remove the accidental white background flash from the loading screen.
- Keep the amber LCD field visible throughout loading.
- Keep any intentional transition flash limited to the card-to-full-view transition.
- Do not flash the entire loading screen white when the loading bar completes.

### 6. Add the card-to-full-view transition

Use this reference image:

`D:\DESKTOP\Portfolio (Basic)\Portfolio Web\UI\state-4-transition-dissolve.png`

When the visitor presses `A — VIEW FULL WORK` from the info card:

1. Keep the current LCD visible.
2. Zoom smoothly toward the console screen.
3. Increase the pixel-grid/pixelation effect.
4. Resolve the selected project sprite into a pixelated version of the artwork.
5. Sharpen the artwork in staged steps until it reaches full resolution.
6. Transition into the full-screen stage view.
7. Avoid a plain fade or abrupt DOM swap.
8. Keep the transition centered on the console LCD.
9. Use CSS transforms, opacity, clip-path, masking, or a lightweight canvas technique if needed.
10. Avoid heavy animation libraries.

When pressing `B` to leave the full view, reverse the resolution transition where practical. Reduced-motion mode should cut directly to the destination state.

### 7. Make the B button black

- Change only the physical B button to black or near-black.
- Keep A vermilion.
- Preserve labels and pressed-state feedback.
- Do not change the accent color elsewhere.

### 8. Redesign the D-pad

Use this reference image:

`C:\Users\abdul\AppData\Local\Temp\codex-clipboard-770dccaf-e7c1-4981-b016-375c147781ea.png`

Redesign the D-pad to match the supplied rounded, chunky cross:

- Use softer rounded corners.
- Use distinct upper, lower, left, and right sections.
- Give it a dark beveled plastic appearance.
- Keep a subtle center depression.
- Keep all four directions as real accessible buttons.
- Preserve keyboard and click interactions.
- Keep it centered in the existing control area.
- Verify it on mobile.

### 9. Correct the Juno loading sprite color

- The Juno loading sprite is darker than the amber LCD.
- Adjust it so it visually belongs to the amber loading screen.
- Preserve dark readable pixels against the amber field.
- Prefer a project-specific class or content property instead of changing every sprite.

### 10. Correct the CAT loading sprite color

Apply the same treatment to the CAT Illustrations loading sprite:

- Match the amber LCD.
- Preserve pixel clarity and contrast.
- Keep the CAT full-view password gate unchanged.
- Only adjust the loading-stage sprite appearance.

### 11. Add retro interface sounds

Create a shared lightweight sound utility using the Web Audio API.

The Areeb Ali reference site uses short synthesized interface sounds. Use the behavior as inspiration, but do not scrape or copy proprietary audio assets from that website.

Add short, subtle sounds for:

- D-pad movement
- A/open
- B/back
- START/power
- Channel changes
- Loading completion
- Full-view transition

Requirements:

- Audio may begin only after a user gesture.
- Never autoplay sound on page load.
- Respect an existing mute control; if none exists, add an unobtrusive mute control.
- Do not interfere with thesis audio, video audio, or voice-agent audio.
- Use the same sound utility for interactive controls on the Everything page.
- Keep sounds short and Game Boy-inspired.

### 12. Add an intro quote and power-on transition

The Areeb Ali reference pattern includes an opening quote, a short hold, a distinct opening sound, and a transition into the device interface.

Add an intro sequence:

- Show a configurable short art/design quote before the console appears.
- Hold the quote for approximately three seconds.
- Transition into the console using the same LCD zoom/pixel-resolution language as requirement 6.
- Pressing START, A, Enter, or Space must skip the quote.
- Do not copy the reference website’s quote.
- Store quotes in an easy-to-edit constant or content file.
- Use original portfolio-appropriate quotes or clearly marked temporary placeholders.
- Respect reduced-motion mode.
- Do not prevent visitors from reaching the project list quickly.

### 13. Remove artwork borders in full view

For the full project view:

- Remove decorative artwork borders/mats from all projects by default.
- Artwork should sit directly on its project-specific background.
- Keep the existing artwork border/mat treatment for LIMINAL only.
- Do not remove functional UI borders such as the pinned console bar or buttons.
- Make this behavior explicit in the content model or block renderer.

### 14. Increase unreadable full-view text

Increase text that is currently too small in full view, especially:

- DLEA AWARDS 2025 stage one
- DLEA AWARDS 2025 stage two
- DLEA AWARDS 2025 stage three
- Any other full-view labels, captions, or explanatory text with the same readability problem

Requirements:

- Use readable responsive sizing with `clamp()`.
- Preserve the monospace interface style.
- Do not let text overpower the artwork.
- Check desktop and mobile layouts.
- Maintain sufficient contrast.

### 15. Rename and enlarge the DLEA heading

On the DLEA AWARDS 2025 page:

- Rename the heading currently written as “by holding” to `VISUALS`.
- Increase the heading size substantially.
- Make the heading clearly visible.
- Increase the sizes of the three stage labels/content blocks as needed.
- Preserve this order:
  1. Stage one — opening announcement
  2. Stage two — tighter announcement
  3. Stage three — ambient hold
- Keep the four ambient visuals clearly readable and visually separated.

### 16. Remove The King’s Hand “before publishing” box

- Remove the “before publishing” box entirely.
- Remove related placeholder copy, styling, and unused logic.
- Keep legally careful wording for case descriptions.
- Keep required credits and attribution.

### 17. Prepare a looping King’s Hand animation slot

An animation asset will be provided later.

- Add a clearly named placeholder entry for the King’s Hand animation.
- Render it as a video when the asset is supplied.
- It should autoplay muted, loop, and play inline, like the DLEA ambient visuals.
- It must not autoplay with sound.
- Use `preload="none"` unless existing ambient-video rules require otherwise.
- Do not invent an asset filename if the file is not present.

### 18. Prepare a looping LIMINAL Breath poster video slot

A video asset will be provided later.

- Add a clearly named media slot in the LIMINAL content.
- Render it in the empty area of the Breath poster composition.
- Autoplay muted, loop, and play inline.
- Preserve LIMINAL’s black-and-white visual treatment.
- Do not stretch or crop the video incorrectly.
- Keep it silent unless the visitor explicitly plays sound.
- Do not invent an asset filename if the file is not present.

### 19. Remove separator em dashes

Find uses of `—` that function only as visual separators or spaces.

- Remove those separator dashes.
- Replace them with spacing, line breaks, or the existing separator style where necessary.
- Do not remove grammatically meaningful em dashes inside prose.
- Check subtitles, credits, labels, stage headings, and project metadata.
- Keep all other portfolio copy unchanged.

### 20. Use project-specific full-view backgrounds

The full-view background must no longer be amber for every project.

Update the content model so backgrounds can be defined per project or per media section.

- LIMINAL: white or near-white.
- Every other project: choose a background that supports the artwork.
- Motion Graphics has three separate works; give each work its own background color.
- Posters has multiple separate works; give each work its own appropriate background.
- Backgrounds must not reduce artwork contrast.
- Keep the pixel-grid texture subtle and optionally configurable per background.
- Preserve LIMINAL’s black-and-white behavior.
- Do not apply one background blindly to the entire Motion Graphics or Posters page.
- Remove artwork borders except where LIMINAL explicitly uses them.

## Technical constraints

- Use the existing Next.js/React architecture.
- Prefer CSS and small React components over new libraries.
- Preserve keyboard controls and accessibility labels.
- Preserve `prefers-reduced-motion`.
- Do not expose API keys.
- Do not break the CAT gate.
- Do not autoplay audio.
- Do not add YouTube, Vimeo, or other external video embeds.
- Do not rewrite portfolio copy except where explicitly requested above.
- Keep the page fast.

## Verification checklist

After implementing the changes:

1. Run lint, typecheck, unit tests, and existing end-to-end tests.
2. Confirm the LED is off when the console is off.
3. Confirm no unwanted white flash occurs at the end of loading.
4. Confirm loading sprites animate and remain pixelated.
5. Confirm the card-to-full-view transition zooms through the LCD.
6. Confirm B is black and the D-pad matches the supplied image.
7. Confirm control instructions appear below the console.
8. Confirm the intro quote can be skipped.
9. Confirm sounds require a user gesture and never autoplay.
10. Confirm DLEA text and `VISUALS` are readable.
11. Confirm The King’s Hand box is gone.
12. Confirm placeholder slots exist for both future videos.
13. Confirm artwork borders are removed except for LIMINAL.
14. Confirm Motion Graphics and Posters support different backgrounds per work.
15. Test desktop, narrow mobile, and reduced-motion mode.

Before finishing, report which files were changed and confirm that every changed file is inside:

`D:\DESKTOP\Portfolio (Basic)\Portfolio Web New - Codex Test`
