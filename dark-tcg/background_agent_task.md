# Dark TCG Improvement Task

## Overview
Transform the Dark TCG game into a more playable 16-bit pixel art fantasy game with working attack/targeting mechanics.

## Requirements

### 1. Fix Attack and Targeting Mechanics
- **Issue**: The current targeting system in GameBoard.jsx has logic issues where clicking handlers overlap
- **Fix needed**:
  - Separate the logic for selecting cards from hand vs selecting creatures for attack
  - Fix the targeting flow so it properly handles both spell targeting and creature attacks
  - Ensure creatures can only attack after their first turn (summoning sickness)
  - Make sure the attack flow completes properly

### 2. 16-bit Pixel Art Theme
- Replace the current CSS with a pixel art aesthetic
- Use CSS to create pixel-perfect borders, shadows, and UI elements
- Color palette should be dark fantasy themed (dark purples, blacks, deep reds, grays)
- Cards should look like pixel art cards with clear borders
- UI elements should have that retro game feel

### 3. Visual Theme: "Escape the Dark Tower"
- Dark, atmospheric medieval fantasy setting
- Gothic and creepy elements
- Stone textures, torchlight effects
- Ominous and foreboding atmosphere
- But still maintaining the 16-bit pixel art style

### 4. Pixel Graphics
- Create pixel art representations for:
  - Energy icons (replace emojis with pixel art symbols)
  - Attack/Health icons
  - Card backgrounds with pixel patterns
  - UI buttons with pixel art style
  - Game board background (dark stone/dungeon texture)
- Use CSS techniques like box-shadow for pixel effects
- Consider using CSS sprites or data URIs for small pixel graphics

### 5. Gameplay Improvements
- Visual feedback for valid targets (highlighting)
- Clear indication of which phase/action is happening
- Better visual distinction between player and opponent areas
- Smooth animations but keeping the retro feel
- Sound effects would be nice but optional

## Technical Approach
1. First fix the targeting/attack logic in GameBoard.jsx
2. Create new CSS files with pixel art theme
3. Replace emoji icons with CSS-based pixel art
4. Add visual effects and animations
5. Test thoroughly to ensure all mechanics work

## Expected Outcome
A fully playable TCG with a dark, 16-bit pixel art aesthetic that feels like a retro dungeon crawler card game.