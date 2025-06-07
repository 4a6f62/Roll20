# HP-AC-NUMB-INT-on-drop.js

**Version:** 0.1beta  
**Author:** 4a6f62  
**GitHub:** [https://github.com/4a6f62](https://github.com/4a6f62)

## Overview

This Roll20 API script automatically configures NPC tokens when dropped onto the VTT canvas. It is designed to streamline combat setup and enhance GM control by:

- Rolling NPC hit points based on the character sheet formula
- Setting armor class (AC) in token bar2
- Naming the token with a unique numbered nameplate (e.g., "Goblin #2")
- Rolling initiative if combat is active
- Adding NPC tooltip data (Speed and Passive Perception) as character Abilities

## Features

✅ Automatically rolls HP using `npc_hpformula`  
✅ Sets fallback HP using `hp` if the formula fails  
✅ Places AC in token `bar2`  
✅ Renames tokens to `Character Name #X` for better tracking  
✅ Rolls initiative using `initiative_bonus` if Turn Tracker is active  
✅ Adds Speed and Passive Perception as character Abilities  
✅ Ignores already-initialized tokens (has `bar1_value`)  
✅ Only affects NPCs (checks `npc = 1` attribute)

## Installation

1. Open the **API Scripts** tab in your Roll20 game (requires Pro subscription).
2. Paste the contents of `HP-AC-NUMB-INT-on-drop.js` into a new script file.
3. Save the script and reload the VTT.
4. You're good to go!

## How It Works

When an NPC token (linked to a character sheet) is dropped on the map:
- If the token has not been initialized and is linked to a character with `npc = 1`:
  - The script rolls HP using `npc_hpformula`
  - Sets AC in bar2
  - Renames the token (`Name #1`, `Name #2`, etc.)
  - Rolls initiative if combat is ongoing
  - Adds two abilities:
    - `Speed: [value]`
    - `Passive Perception: [value]`

These Abilities are visible under the character sheet's **Attributes & Abilities** tab and can be referenced by the GM.

## Notes

- The script prevents duplicate processing using a short cooldown.
- You can toggle debug mode by setting `debug = true` inside the script.

## Known Limitations

- Only works on tokens linked to a character sheet with `npc = 1`.
- Initiative is not sorted automatically—manual adjustment may be needed.
- Tooltip abilities are not shown in token hover by default; they are added for quick GM reference.

## Credits

Built by 4a6f62  
Inspired by common needs for managing NPCs quickly and cleanly during combat.

---

Pull requests, improvements, or customizations are welcome via GitHub!
