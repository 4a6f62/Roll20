/* globals log, on, playerIsGM, state, sendChat, findObjs, getObj, createObj */
const UnifiedDamageScript = (() => { //eslint-disable-line no-unused-vars

  const scriptName = 'UnifiedDamageScript';
  const version = '1.0.0';

  const config = {
    settings: {
      sheet: 'dnd5e_r20',
      hpBar: 1,
      acBar: 2,
      gmOnly: true,
      templates: {
        names: ['atkdmg', 'dmg', 'npcfullatk', 'npcdmg'],
        damageFields: ['dmg1', 'dmg2', 'globaldamage'],
        critFields: ['crit1', 'crit2', 'globaldamagecrit']
      },
      buttons: ['damageCrit', 'damageFull', 'damageHalf', 'damageVuln', 'damageResist', 'healingFull']
    },
    fetchFromState: function() {
      if (state[scriptName] && state[scriptName].settings) {
        Object.assign(this.settings, state[scriptName].settings);
      }
    },
    saveToState: function() {
      if (!state[scriptName]) state[scriptName] = { settings: {} };
      Object.assign(state[scriptName].settings, this.settings);
    }
  };

  const styles = {
    outer: 'border-radius: 5px; margin: 3px; padding: 3px; background-color: #f0f0f0; border: 1px solid #ccc;',
    rollName: 'font-weight: bold; color: #333; margin-bottom: 5px;',
    buttonContainer: 'display: inline-block; margin: 2px;',
    buttonShared: 'display: inline-block; padding: 4px 6px; margin: 2px; border-radius: 3px; text-decoration: none; color: white; font-weight: bold; font-size: 10px; text-align: center; min-width: 45px;',
    critical: 'background-color: #721c24; border: 1px solid #5a161d;',
    damage: 'background-color: #dc3545; border: 1px solid #c82333;',
    half: 'background-color: #fd7e14; border: 1px solid #e96800;',
    healFull: 'background-color: #28a745; border: 1px solid #1e7e34;',
    vulnerable: 'background-color: #6f42c1; border: 1px solid #5a2d91;',
    resistant: 'background-color: #17a2b8; border: 1px solid #138496;',
    error: 'background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; padding: 5px; border-radius: 3px;'
  };

  const buttons = {
    damageCrit: {
      label: `Critical (%)`,
      style: styles.critical,
      math: (d, c) => -(d + c), // Normal damage + crit dice, not double
      content: 'CRIT'
    },
    damageFull: {
      label: `Full Damage (%)`,
      style: styles.damage,
      math: (d) => -(1 * d),
      content: 'FULL'
    },
    damageHalf: {
      label: `Save for Half (%)`,
      style: styles.half,
      math: (d) => -(Math.floor(0.5 * d)),
      content: 'HALF'
    },
    damageVuln: {
      label: `Vulnerable (%)`,
      style: styles.vulnerable,
      math: (d) => -(d * 2),
      content: 'VULN'
    },
    damageResist: {
      label: `Resistant (%)`,
      style: styles.resistant,
      math: (d) => -(Math.floor(d * 0.5)),
      content: 'RESIST'
    },
    healingFull: {
      label: `Heal (%)`,
      style: styles.healFull,
      math: (d) => `+${(1 * d)}`,
      content: 'HEAL'
    },
    create: function(buttonName, damage, crit) {
      let btn = this[buttonName];
      if (!btn) return '';
      let modifier = btn.math(damage, crit);
      let label = btn.label.replace(/%/, `${Math.abs(modifier)}HP`);
      return `<div style="${styles.buttonContainer}" title="${label}"><a href="!token-mod --set bar${config.settings.hpBar}_value|${modifier}" style="${styles.buttonShared}${btn.style}">${btn.content}</a></div>`;
    }
  };

  // Status marker update function (enhanced from damage.js)
  const updateTokenStatus = (token) => {
    if (!token) {
      log('updateTokenStatus: No token provided');
      return;
    }
    
    const tokenName = token.get("name") || "Unknown Token";
    const currentHealth = parseInt(token.get("bar1_value")) || 0;
    const maxHealth = parseInt(token.get("bar1_max")) || 0;
    
    log(`Updating status for ${tokenName}: ${currentHealth}/${maxHealth} HP`);
    
    if (maxHealth <= 0) {
      log(`Token ${tokenName} has no max HP set, skipping status update`);
      return;
    }
    
    const healthPercentage = (currentHealth / maxHealth) * 100;
    
    // Get character info for player check
    const characterId = token.get("represents");
    const character = characterId ? getObj("character", characterId) : null;
    const isPlayerCharacter = character && character.get("controlledby").length > 0;
    
    log(`${tokenName} health: ${healthPercentage.toFixed(1)}%, isPC: ${isPlayerCharacter}`);
    
    // Remove existing status markers
    token.set("status_yellow", false);
    token.set("status_red", false);
    token.set("status_dead", false);
    token.set("status_skull", false);
    
    // Apply status markers based on health
    if (healthPercentage <= 0) {
      if (isPlayerCharacter) {
        token.set("rotation", 90);
        token.set("status_skull", true);
        log(`${tokenName} is unconscious (PC)`);
      } else {
        token.set("status_dead", true);
        log(`${tokenName} is dead (NPC)`);
      }
    } else if (healthPercentage <= 25) {
      token.set("status_red", true);
      log(`${tokenName} is badly wounded (red)`);
    } else if (healthPercentage <= 50) {
      token.set("status_yellow", true);
      log(`${tokenName} is wounded (yellow)`);
    } else {
      log(`${tokenName} is healthy`);
    }
  };

  // Character assignment function (simplified from FF.js)
  const assignCharacterToPlayer = (characterId, playerId) => {
    const character = getObj("character", characterId);
    if (!character) return false;
    
    // Get player name
    const player = getObj("player", playerId);
    if (!player) return false;
   
    const playerName = player.get("displayname");
    
    ['inplayerjournals', 'controlledby'].forEach((fieldname) => {
        // Rule: character should be assigned to userid in ${accountAttributeName}, 'all' is additive            
        const valueArray = character.get(fieldname).split(',')
        const valueNew = player.get('_id') + (('all' in valueArray) ? ',all' : '');
        if (valueNew !== character.get(fieldname)) {
            log(`character ${character.get("_id")} update  ${fieldname} value ${character.get(fieldname)} to ${valueNew}`);
            character.set(fieldname, valueNew);
        }
    });
  };
  
    const assignCharactersToPlayers = () => {
        
        const players = findObjs({ type: 'player' });
        log(`#players = ${players.length}`);
        log(`playerList = '${JSON.stringify(players)}`);
        
        const characters = findObjs({ type: 'character' });
        
        log(`#characters = ${characters.length}`);
        log(`charactersList = '${JSON.stringify(characters)}`);
        
        characters.forEach(character => {
            players.forEach(player => {
                let playerid = player.get('id');
                let d20userid = player.get('_d20userid');
                let characterid = character.get('id');
                let ffwplayerAttr = findObjs({ type: 'attribute', _characterid: characterid, name: 'ffwplayerid' })[0];
                if(!ffwplayerAttr) return;
                let ffwplayerid = ffwplayerAttr ? ffwplayerAttr.get('current') : null;
                if(!ffwplayerid) return;
           
                if(d20userid == ffwplayerid) {
                    assignCharacterToPlayer(characterid, playerid);
                    return;
                }           
            });
        });
      };

  const sendButtons = (damage, crit, msg) => {
    let buttonHtml = '';
    const activeButtons = config.settings.buttons;
    const name = findName(msg.content) || 'Apply:';
    
    log(`Creating ${activeButtons.length} buttons for damage: ${damage}, crit: ${crit}, name: ${name}`);
    
    activeButtons.forEach(btn => {
      const buttonCode = buttons.create(btn, damage, crit);
      buttonHtml += buttonCode;
      if (!buttonCode) {
        log(`⚠ Failed to create button: ${btn}`);
      }
    });
    
    log(`✓ Created button HTML (${buttonHtml.length} chars)`);
    
    const buttonTemplate = `<div style="${styles.outer}"><div style="${styles.rollName}">${name}</div>${buttonHtml}</div>`;
    const whisper = config.settings.gmOnly ? '/w gm ' : '';
    sendChat(scriptName, `${whisper}${buttonTemplate}`);
  };

  const handleDamageRoll = (msg) => {
    log(`Processing damage roll for template: ${msg.rolltemplate}`);
    
    const dmgFields = config.settings.templates.damageFields || [];
    const critFields = config.settings.templates.critFields || [];
    
    let dmgTotal = processFields(dmgFields, msg);
    let critTotal = processFields(critFields, msg);
    
    log(`Totals - Damage: ${dmgTotal}, Crit: ${critTotal}`);
    log(`Crit calculation: Normal(${dmgTotal}) + Crit(${critTotal}) = ${dmgTotal + critTotal}`);
    
    // Show buttons if there's damage OR if it's a damage template (even with 0 damage)
    if (dmgTotal > 0 || config.settings.templates.names.includes(msg.rolltemplate)) {
      sendButtons(dmgTotal, critTotal, msg);
    } else {
      log(`✗ No damage found and template not configured, not sending buttons`);
    }
  };

  const processFields = (fieldArray, msg) => {
    const rolls = msg.inlinerolls || [];
    let total = 0;
    
    log(`Processing fields: [${fieldArray.join(', ')}]`);
    
    fieldArray.forEach(field => {
      // Look for field patterns with DOUBLE curly braces like the D&D 5e sheet uses
      const rxIndex = new RegExp(`{{${field}=\\$\\[\\[(\\d+)\\]\\]}}`, 'g');
      
      let match;
      while ((match = rxIndex.exec(msg.content)) !== null) {
        const rollIndex = parseInt(match[1]);
        
        if (rolls[rollIndex] && rolls[rollIndex].results && rolls[rollIndex].results.total) {
          const damage = rolls[rollIndex].results.total;
          total += damage;
          log(`Found ${field}: ${damage} (roll index ${rollIndex})`);
        }
      }
    });
    
    return total;
  };

  const checkIfDamageRoll = (msg) => {
    const content = msg.content.toLowerCase();
    
    // Very specific damage indicators - must have actual damage rolls
    const damageIndicators = [
      '{{damage=', '{{dmg=', '{damage=', '{dmg=',
      'slashing', 'piercing', 'bludgeoning', 'fire', 'cold', 'lightning', 'thunder', 'acid', 'poison', 'psychic', 'radiant', 'necrotic', 'force'
    ];
    
    // Check if the content contains damage-related words
    const hasDamageWords = damageIndicators.some(indicator => content.includes(indicator));
    
    // Check if there are inline rolls (damage usually has rolls)
    const hasInlineRolls = msg.inlinerolls && msg.inlinerolls.length > 0;
    
    // Check if it's specifically an attack roll without damage
    const isAttackOnly = (content.includes('{{attack=') || content.includes('{attack=')) && 
                         !content.includes('{{damage=') && !content.includes('{damage=') &&
                         !content.includes('{{dmg=') && !content.includes('{dmg=');
    
    // Check if it has "to hit" language which indicates attack roll
    const hasToHit = content.includes('to hit') || content.includes('attack');
    
    log(`Damage check - hasDamageWords: ${hasDamageWords}, hasInlineRolls: ${hasInlineRolls}, isAttackOnly: ${isAttackOnly}, hasToHit: ${hasToHit}`);
    
    // Only show buttons if it has damage words AND inline rolls AND is NOT just an attack
    return hasDamageWords && hasInlineRolls && !isAttackOnly;
  };

  const findName = (msgContent) => {
    // Look for name in double curly braces like D&D 5e sheet uses
    const rxName = /{{name=([^}]+)}}/i;
    const name = msgContent.match(rxName);
    return name ? name[1] : null;
  };

  const applyDamageManually = (modifier) => {
    // Find tokens that are selected or have been recently modified
    const allTokens = findObjs({ 
      type: 'graphic', 
      subtype: 'token',
      layer: 'objects'
    }).filter(token => {
      const hasHP = token.get('bar1_max') > 0;
      return hasHP;
    });
    
    if (allTokens.length === 0) {
      log('No tokens with HP bars found');
      return;
    }
    
    // For now, let's just log what we would do
    log(`Would apply ${modifier} damage to ${allTokens.length} tokens`);
    
    // In a real scenario, you'd need to implement token selection logic
    // This is a limitation of the Roll20 API - it can't access current selections
    sendChat(scriptName, `/w gm To apply damage: Select tokens first, then click the damage buttons. Found ${allTokens.length} tokens with HP bars.`);
  };

  const applyDamage = (modifier) => {
    // This function will be called when damage buttons are clicked
    // We need to get the selected tokens from the current selection
    if (!Campaign().get('turnorder')) {
      sendChat(scriptName, '/w gm Please select tokens first, then click the damage buttons.');
      return;
    }
    
    // Get all tokens on the objects layer that have HP bars
    const allTokens = findObjs({ 
      type: 'graphic', 
      subtype: 'token',
      layer: 'objects'
    }).filter(token => token.get('bar1_max') > 0);
    
    if (allTokens.length === 0) {
      sendChat(scriptName, '/w gm No tokens with HP bars found on the map.');
      return;
    }
    
    // For now, let's apply to all tokens with HP bars (you can modify this logic)
    // In a real game, you'd want to select specific tokens
    sendChat(scriptName, `/w gm Click on tokens first, then use: !apply-damage ${modifier}`);
  };

  const handleInput = (msg) => {
    // Log ALL chat messages to help debug
    if (msg.type === 'rollresult' || msg.rolltemplate) {
      log(`=== CHAT MESSAGE DEBUG ===`);
      log(`Message type: ${msg.type}`);
      log(`Roll template: ${msg.rolltemplate || 'none'}`);
      log(`Player ID: ${msg.playerid}`);
      log(`Content: ${msg.content}`);
      log(`Has inline rolls: ${msg.inlinerolls ? msg.inlinerolls.length : 0}`);
      if (msg.inlinerolls) {
        msg.inlinerolls.forEach((roll, i) => {
          log(`Roll ${i}: ${roll.results ? roll.results.total : 'no results'}`);
        });
      }
      log(`=== END DEBUG ===`);
    }
    
    // Listen for TokenMod commands and update status markers afterward
    if (msg.type === 'api' && msg.content.includes('!token-mod') && msg.content.includes('bar1_value')) {
      log(`TokenMod command detected: ${msg.content}`);
      
      // Wait a moment for TokenMod to finish, then update all tokens
      setTimeout(() => {
        log(`Updating status markers after TokenMod command`);
        const allTokens = findObjs({ 
          type: 'graphic', 
          subtype: 'token',
          layer: 'objects'
        }).filter(token => token.get('bar1_max') > 0);
        
        allTokens.forEach(token => {
          updateTokenStatus(token);
        });
        
        log(`Updated status for ${allTokens.length} tokens after TokenMod`);
      }, 500); // Wait 500ms for TokenMod to complete
    }
    
    // Handle API commands
    if (msg.type === 'api' && playerIsGM(msg.playerid)) {
      if (/^!apply-damage\s+([+-]?\d+)/.test(msg.content)) {
        const modifier = parseInt(msg.content.match(/([+-]?\d+)/)[1]);
        log(`Applying damage: ${modifier}`);
        
        // Try token-mod first, then fallback to manual application
        const tokenModCommand = `!token-mod --set bar1_value|${modifier > 0 ? '+' : ''}${modifier}`;
        log(`Sending token-mod command: ${tokenModCommand}`);
        sendChat('token-mod', tokenModCommand);
        
        // Also try manual application as backup
        setTimeout(() => {
          applyDamageManually(modifier);
        }, 100);
        return;
      }
      
      if (/^!test-buttons/.test(msg.content)) {
        // Test function to create buttons manually
        const testMsg = {
          content: '{{name=Test Attack}} {{damage=$[[0]]}}',
          rolltemplate: 'atk',
          inlinerolls: [{ results: { total: 8 } }]
        };
        log(`Testing all buttons with 8 damage, 16 crit`);
        log(`Button list: ${config.settings.buttons.join(', ')}`);
        sendButtons(8, 16, testMsg);
        return;
      }
      
      if (/^!test-crit/.test(msg.content)) {
        // Test crit damage calculation
        const testMsg = {
          content: '{{name=Longsword}} {{dmg1=$[[0]]}} {{dmg1type=slashing}} {{crit1=$[[1]]}}',
          rolltemplate: 'dmg',
          inlinerolls: [
            { results: { total: 14 } }, // 1d8+6 = 14
            { results: { total: 3 } }   // Extra 1d8 = 3
          ]
        };
        log(`Testing crit: Normal=14, Crit=3, Total should be 17`);
        handleDamageRoll(testMsg);
        return;
      }
      
      if (/^!test-npc/.test(msg.content)) {
        // Test NPC damage template
        const testMsg = {
          content: '{{name=Orc Attack}} {{dmg1=$[[0]]}} {{dmg1type=slashing}}',
          rolltemplate: 'npcdmg',
          inlinerolls: [{ results: { total: 6 } }]
        };
        log(`Testing NPC damage template with 6 damage`);
        log(`Template: ${testMsg.rolltemplate}`);
        log(`Content: ${testMsg.content}`);
        handleDamageRoll(testMsg);
        return;
      }
      
      if (/^!test-status/.test(msg.content)) {
        // Test status marker updates
        const allTokens = findObjs({ 
          type: 'graphic', 
          subtype: 'token',
          layer: 'objects'
        }).filter(token => token.get('bar1_max') > 0);
        
        log(`Testing status updates on ${allTokens.length} tokens`);
        
        allTokens.forEach(token => {
          log(`Updating status for token: ${token.get('name')}`);
          updateTokenStatus(token);
        });
        
        sendChat(scriptName, `/w gm Updated status for ${allTokens.length} tokens with HP bars.`);
        return;
      }
      
      if (/^!assign/.test(msg.content)) {
        sendChat(scriptName, `/w gm assiging characters.`);
        assignCharactersToPlayers();
        return;
      }
    }
    
    // Handle damage roll templates - simplified like original AutoButtons
    if (msg.rolltemplate) {
      log(`Checking template: "${msg.rolltemplate}" against configured templates`);
      log(`Current config templates: [${config.settings.templates.names.join(', ')}]`);
      
      if (config.settings.templates.names.includes(msg.rolltemplate)) {
        log(`✓ Found matching template: ${msg.rolltemplate}`);
        handleDamageRoll(msg);
      } else {
        log(`✗ Template "${msg.rolltemplate}" not in configured list: [${config.settings.templates.names.join(', ')}]`);
      }
    }
  };

  const initScript = () => {
    log(`-=> ${scriptName} v${version} <=-`);
    
    if (!state[scriptName]) {
      state[scriptName] = {
        version: version,
        settings: config.settings
      };
    }
    
    // Always save our current config to state to ensure it's up to date
    config.saveToState();
    
    log(`Template names loaded: [${config.settings.templates.names.join(', ')}]`);
    
    // Event handlers
    on('chat:message', handleInput);
    
    // Enhanced HP change detection for status updates
    on('change:graphic:bar1_value', (obj, prev) => {
      const newValue = obj.get('bar1_value');
      const oldValue = prev.bar1_value;
      
      log(`HP changed on token ${obj.get('name')}: ${oldValue} -> ${newValue}`);
      
      // Update status markers when HP changes
      if (newValue !== oldValue) {
        updateTokenStatus(obj);
      }
    });
    
    // Also listen for max HP changes in case tokens are being set up
    on('change:graphic:bar1_max', (obj, prev) => {
      if (obj.get('bar1_max') !== prev.bar1_max) {
        updateTokenStatus(obj);
      }
    });
    log(`${scriptName} initialized successfully`);
  };

  // Initialize on ready
  on('ready', initScript);

  return {
    version,
    assignCharacterToPlayer,
    applyDamage,
    updateTokenStatus
  };

})();
