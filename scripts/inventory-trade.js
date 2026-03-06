/**
 * simple-token-trade | inventory-trade.js
 * Hooks into the character sheet item context menu to offer a "Trade" option.
 * Compatible with: dnd5e default sheet, Tidy5e Sheet (kgar + sdenec),
 *                  Character Sheet Plus, and other dnd5e-based sheets.
 */

import { TradeSession } from "./trade-session.js";
import { TradeApp }     from "./trade-app.js";

// ─── Item ID resolution (multi-sheet compatible) ──────────────────────────────

function _resolveItemId(li) {
  const el = li instanceof jQuery ? li[0] : li;

  if (el.dataset?.itemId)      return el.dataset.itemId;
  if (el.dataset?.tidyItemId)  return el.dataset.tidyItemId;

  if (li instanceof jQuery) {
    const jqId = li.data("item-id") ?? li.data("tidy-item-id");
    if (jqId) return String(jqId);
  }

  const ancestor = el.closest(
    "[data-item-id], [data-tidy-item-id], [data-entry-id]"
  );
  if (ancestor) {
    return (
      ancestor.dataset.itemId     ??
      ancestor.dataset.tidyItemId ??
      ancestor.dataset.entryId    ??
      null
    );
  }

  return null;
}

// ─── Context Menu Hooks ───────────────────────────────────────────────────────

function _buildTradeEntry(resolveActor, resolveItemId_fn) {
  return {
    name: "Trade",
    icon: '<i class="fas fa-exchange-alt"></i>',
    condition: (li) => {
      const actor  = resolveActor(li);
      const itemId = resolveItemId_fn(li);
      if (!actor || !itemId) return false;
      const item = actor.items.get(itemId);
      if (!item) return false;
      const TRADEABLE = new Set([
        "weapon","equipment","consumable","tool","loot","container","backpack"
      ]);
      return TRADEABLE.has(item.type) && actor.isOwner;
    },
    callback: (li) => {
      const actor  = resolveActor(li);
      const itemId = resolveItemId_fn(li);
      if (!actor || !itemId) return;
      _openTradeDialog(actor, itemId);
    },
  };
}

// ── Hook 1: Default dnd5e sheet ───────────────────────────────────────────────
Hooks.on("getActorSheetItemContextOptions", (sheet, options) => {
  options.push(_buildTradeEntry(
    () => sheet.actor,
    (li) => _resolveItemId(li)
  ));
});

// ── Hook 2: Tidy5e sheet (kgar) – fires dnd5e.getItemContextOptions ───────────
// Signature: (item, options) — item is the Item document directly
Hooks.on("dnd5e.getItemContextOptions", (item, options) => {
  const actor = item?.parent;
  if (!actor || actor.documentName !== "Actor") return;

  options.push({
    name: "Trade",
    icon: '<i class="fas fa-exchange-alt"></i>',
    condition: () => {
      const TRADEABLE = new Set([
        "weapon","equipment","consumable","tool","loot","container","backpack"
      ]);
      return TRADEABLE.has(item.type) && actor.isOwner;
    },
    callback: () => {
      _openTradeDialog(actor, item.id);
    },
  });
});

// ─── Player / Actor Selection ─────────────────────────────────────────────────

async function _openTradeDialog(actorA, initialItemId = null) {
  const candidates = _buildCandidates(actorA);

  if (!candidates.length) {
    ui.notifications.warn("No other actors available to trade with.");
    return;
  }

  const optionsHTML = candidates
    .map(a => `<option value="${a.id}">${a.name}</option>`)
    .join("");

  const content = `
    <form>
      <div class="form-group">
        <label>Trade with:</label>
        <div class="form-fields">
          <select name="actorId">${optionsHTML}</select>
        </div>
      </div>
    </form>`;

  let actorBId;
  try {
    actorBId = await Dialog.prompt({
      title:    "Start Trade",
      content,
      label:    "Open Trade",
      callback: (html) => html.find('[name="actorId"]').val(),
    });
  } catch {
    return;
  }

  if (!actorBId) return;
  const actorB = game.actors.get(actorBId);
  if (!actorB) return;

  const session = new TradeSession(actorA.id, actorB.id);
  const app     = new TradeApp(session, initialItemId);
  app.render(true);

  globalThis.simpleTrade.socket.sendTradeRequest(session, initialItemId);
}

// ─── Candidate Building ───────────────────────────────────────────────────────

function _buildCandidates(actorA) {
  const result = [];
  const seen   = new Set();

  for (const user of game.users) {
    if (user.id === game.user.id || !user.character) continue;
    if (user.character.id === actorA.id || seen.has(user.character.id)) continue;
    seen.add(user.character.id);
    result.push(user.character);
  }

  for (const tokenDoc of game.scenes?.active?.tokens ?? []) {
    const actor = tokenDoc.actor;
    if (!actor || actor.id === actorA.id || seen.has(actor.id)) continue;
    if (!["character", "npc"].includes(actor.type)) continue;
    seen.add(actor.id);
    result.push(actor);
  }

  return result;
}
