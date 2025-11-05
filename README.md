# UnifiedDamageScript.js

**Version:** 1.0.0  
**Author:** 4a6f62  
**GitHub:** [https://github.com/4a6f62](https://github.com/4a6f62/Roll20/blob/ff8a086a0ba136857066a6a88582e01d3e2f7092/UnifiedDamageScript.js)

## Overview

The Unified Damage Script is a Roll20 API script designed to streamline and automate the application of damage, healing, and status markers for tokens, with full support for the D&D 5e sheet (`dnd5e_r20`). It detects damage or healing in chat rolls, provides clickable buttons for common actions (full damage, crit, half, heal, resist, vuln), and updates token status markers based on their HP—making combat fluid and visual management easy for GMs.

## TokenMod Requirement

**TokenMod Script Required**  
For full button functionality (automatic HP changes when clicking damage/healing buttons), the [TokenMod API script](https://wiki.roll20.net/TokenMod) must be installed in your Roll20 game.  
If TokenMod is not present, damage/healing must be processed manually, as the buttons will not be able to interact with token HP bars automatically.

## Features

- **Automated damage/healing buttons:** When a supported damage/healing roll appears in chat, the script generates styled buttons for actions like full/critical/half/resist/vulnerable/healing.
- **TokenMod Integration:** Damage or healing is instantly applied to selected tokens using the TokenMod API.
- **Status Marker Automation:** Tokens are automatically marked as wounded, badly wounded, unconscious, or dead based on their HP percentage—distinguishing between NPCs and PCs.
- **Template Support:** Works with common D&D5e roll templates (`atkdmg`, `dmg`, `npcfullatk`, `npcdmg`) and customizable fields.
- **Manual Application:** Includes API chat commands for manual tests, status refresh, and mass damage/healing application.
- **Character Assignment Utility:** Supports mass assignment of characters to players by custom attribute for campaign prep.

## Installation and Usage

1. **Requires Roll20 Pro**: Install via the API Scripts tab.
2. **Copy Script**: Paste the contents of `UnifiedDamageScript.js`.
3. **Install TokenMod**: Ensure the [TokenMod script](https://wiki.roll20.net/TokenMod) is installed for automated damage/healing.
4. **Simply Play**: As damage is rolled in chat, action buttons appear for the GM (or all, if configured). Select relevant tokens and click a button to apply effects.

### GM Commands

- `!apply-damage N` — Manually apply N HP (negative = damage, positive = healing) to selected tokens.
- `!test-buttons`, `!test-crit`, `!test-npc`, `!test-status` — Run various test scenarios.
- `!assign` — Bulk assign characters to players by attribute.

## Customization

The script’s config object allows you to adjust templates, fields, and button options to suit homebrew or other systems.

## Limitations

- Requires TokenMod script for automatic HP changes via buttons.
- Only applies to tokens with HP bars and compatible roll templates.
- Token selection in Roll20 API is limited; the script targets selected or all tokens with HP bars, as defined.

---

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
