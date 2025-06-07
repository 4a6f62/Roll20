/**
 * HP-AC-NUMB-INT-on-drop.js
 * Version: 0.1beta
 * Author: 4a6f62
 * GitHub: https://github.com/4a6f62
 * Description:
 *   Automatically configures NPC tokens when dropped onto the map:
 *   - Rolls HP from formula
 *   - Sets AC in bar2
 *   - Sets numbered nameplate
 *   - Rolls initiative if combat is active
 *   - Adds GM tooltip with Speed and Passive Perception
 */

const HP_AC_NUMB_INT_on_drop = (() => {
    'use strict';

    const version = '0.1beta';
    const author = '4a6f62';
    const github = 'https://github.com/4a6f62';
    const debug = false;
    const COOLDOWN_MS = 2000;

    const processed = new Set();
    const logDebug = (msg) => {
        if (debug) {
            sendChat('HP-AC-NUMB-INT', `/w gm [DEBUG] ${msg}`);
        }
    };

    const isCombatActive = () => {
        const order = Campaign().get('turnorder');
        return !!order;
    };

    const getAttr = (attrs, name) =>
        attrs.find((a) => a.get('name') === name)?.get('current') ?? '';

    const countNamedTokens = (baseName, pageId) =>
        findObjs({ type: 'graphic', subtype: 'token', _pageid: pageId })
            .filter(t => t.get('name')?.startsWith(baseName)).length;

    const nameplateWithNumber = (token, name) => {
        logDebug(`nameplateWithNumber: ${name}`);
        if (!name) return;

        const count = countNamedTokens(name, token.get('pageid')) + 1;
        token.set({
            showplayers_name: true,
            name: `${name} #${count}`
        });
        logDebug(`Nameplate: ${name} #${count}`);
    };

    const rollHP = (token, formula, fallbackHP, label) => {
        if (formula) {
            sendChat('', `/r ${formula}`, (ops) => {
                try {
                    const val = JSON.parse(ops[0].content).total;
                    token.set({ bar1_value: val, bar1_max: val });
                    sendChat('HP-Roller', `/w gm Rolled HP for ${label}: ${val}`);
                } catch {
                    token.set({ bar1_value: fallbackHP, bar1_max: fallbackHP });
                }
            });
        } else {
            token.set({ bar1_value: fallbackHP, bar1_max: fallbackHP });
        }
    };

    const rollInitiative = (token, mod = 0, name) => {
        const charId = token.get('represents');
        if (!charId || !isCombatActive()) return;
        
        logDebug(charId);
        logDebug(token.id);
        
        const roll = Math.floor(Math.random() * 21);
        try {
            const total = roll + mod;
            let turnorder = Campaign().get('turnorder');
            turnorder = JSON.parse(turnorder);
            turnorder.push({
                id: token.id,
                pr: parseFloat(total),
                custom: name,
                _pageid: token.get('pageid')
            });
            turnorder = JSON.stringify(turnorder);
            logDebug(`Initiative turnorder: ${turnorder}`);
            Campaign().set('turnorder', turnorder);
            logDebug(`Initiative: ${name}: ${total}`);
        } catch (e) {
            logDebug(`Initiative error: ${e.message}`);
        }
    };

    const addOrUpdateAbility = (name, content, charId) => {
        let ability = findObjs({ type: 'ability', characterid: charId, name })[0];
        if (!ability) {
            createObj('ability', {
                characterid: charId,
                name,
                action: content,
                istokenaction: true
            });
        } else {
            ability.set('action', content);
        }
    };

    const handleTokenDrop = (token) => {
        const id = token.id;
        if (processed.has(id)) return;
        processed.add(id);
        setTimeout(() => processed.delete(id), COOLDOWN_MS);

        if (!token.get('represents') || token.get('bar1_value')) return;

        const charId = token.get('represents');
        const character = getObj('character', charId);
        if (!character) return;

        const attrs = findObjs({ type: 'attribute', characterid: charId });
        if (getAttr(attrs, 'npc') !== '1') return;

        const hpFormula = getAttr(attrs, 'npc_hpformula').trim();
        const hpFallback = parseInt(getAttr(attrs, 'hp'), 10) || 1;
        const ac = parseInt(getAttr(attrs, 'npc_ac'), 10) || 0;
        const initMod = parseInt(getAttr(attrs, 'initiative_bonus'), 10) || 0;

        token.set({ bar2_value: ac });
        nameplateWithNumber(token, character.get('name'));
        rollHP(token, hpFormula, hpFallback, character.get('name'));
        rollInitiative(token, initMod, character.get('name'));
        addOrUpdateAbility('Speed: ' + getAttr(attrs, 'npc_speed'), '', charId);
        addOrUpdateAbility('Passive Perception: ' + getAttr(attrs, 'passive_wisdom'), '', charId);
    };

    const register = () => {
        on('add:token', handleTokenDrop);
    };

    const announce = () => {
        log(`HP-AC-NUMB-INT-on-drop v${version} by ${author}`);
        log(`GitHub: ${github}`);
    };

    return {
        CheckInstall: announce,
        RegisterEventHandlers: register
    };
})();

on('ready', () => {
    HP_AC_NUMB_INT_on_drop.CheckInstall();
    HP_AC_NUMB_INT_on_drop.RegisterEventHandlers();
});
