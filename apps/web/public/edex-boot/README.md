# eDEX-UI Boot Screen - Standalone

A standalone version of the iconic eDEX-UI boot screen that you can use in your own projects.

## Features

- **Realistic boot log**: Scrolling terminal text with authentic system messages
- **Glitch title effect**: eDEX-UI logo with sci-fi glitch animation
- **Sound effects**: Terminal sounds and theme music
- **Responsive design**: Works on different screen sizes
- **Easy integration**: Self-contained with no dependencies

## Files Structure

```
edex-boot-screen/
├── index.html          # Main HTML file
├── css/
│   └── boot_screen.css  # Boot screen styling and animations
├── js/
│   └── boot_screen.js   # Boot sequence logic
├── audio/
│   ├── stdout.wav       # Terminal typing sound
│   ├── granted.wav      # Boot complete sound
│   └── theme.wav        # Title screen theme
├── assets/
│   └── boot_log.txt     # Original boot log text
└── README.md            # This file
```

## Usage

### Basic Usage
1. Copy the entire `edex-boot-screen` folder to your project
2. Open `index.html` in a web browser
3. The boot sequence will start automatically

### Integration
Include in your project:

```html
<link rel="stylesheet" href="path/to/edex-boot-screen/css/boot_screen.css">
<section id="boot_screen"></section>
<script src="path/to/edex-boot-screen/js/boot_screen.js"></script>
```

### Customization

**Colors**: Edit CSS variables in `index.html`:
```css
:root {
    --color_r: 0;    /* Red component */
    --color_g: 255;  /* Green component */
    --color_b: 255;  /* Blue component */
}
```

**Skip intro**: Click anywhere during boot log to skip to title screen

**Add callback**: Modify the end of `displayTitleScreen()` function to add your own logic after boot completion

**Disable audio**: Comment out audio play calls in `boot_screen.js`

## Browser Compatibility

- Modern browsers with ES6+ support
- Audio autoplay may be blocked by browser policies
- For best experience, ensure audio autoplay is enabled

## License

Extracted from eDEX-UI project (GPL-3.0)
Original project: https://github.com/GitSquared/edex-ui

## Credits

- Original eDEX-UI by Gabriel 'Squared' SAILLARD
- Boot screen inspired by TRON Legacy movie effects