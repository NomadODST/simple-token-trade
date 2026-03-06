/**
 * simple-token-trade | trade-socket.js
 * Handles all socket communication for trade synchronization.
 */

import { TradeSession } from "./trade-session.js";
import { TradeApp }     from "./trade-app.js";

export class TradeSocket {
  constructor() {
    globalThis.simpleTrade.socket = this;
  }

  // ─── Emit helpers ────────────────────────────────────────────────────────

  emit(action, payload) {
    game.socket.emit("module.simple-token-trade", { action, payload });
  }

  // ─── Incoming handler ────────────────────────────────────────────────────

  handle({ action, payload }) {
    switch (action) {
      case "tradeRequest":  return this._onTradeRequest(payload);
      case "tradeUpdate":   return this._onTradeUpdate(payload);
      case "tradeAccept":   return this._onTradeUpdate(payload);
      case "tradeExecuted": return this._onTradeExecuted(payload);
      case "tradeCancel":   return this._onTradeCancel(payload);
      default:
        console.warn("simple-token-trade | Unknown socket action:", action);
    }
  }

  // ─── Actions ─────────────────────────────────────────────────────────────

  sendTradeRequest(session, initialItemId = null) {
    this.emit("tradeRequest", {
      session: session.toJSON(),
      initialItemId,
    });
  }

  sendTradeUpdate(session) {
    this.emit("tradeUpdate", { session: session.toJSON() });
  }

  sendAcceptUpdate(session) {
    this.emit("tradeAccept", { session: session.toJSON() });
  }

  sendTradeExecuted(sessionId) {
    this.emit("tradeExecuted", { sessionId });
  }

  sendTradeCancel(sessionId) {
    this.emit("tradeCancel", { sessionId });
  }

  // ─── Receivers ───────────────────────────────────────────────────────────

  _onTradeRequest({ session: data, initialItemId }) {
    const myActors = game.actors.filter(a =>
      game.user.character?.id === a.id ||
      a.ownership[game.user.id] >= CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER
    );

    const isActorA = myActors.some(a => a.id === data.actorAId);
    const isActorB = myActors.some(a => a.id === data.actorBId);

    if (!isActorA && !isActorB) return;

    let session = globalThis.simpleTrade.sessions[data.id];
    if (!session) {
      session = new TradeSession(data.actorAId, data.actorBId, data.id);
    }
    session.updateFromJSON(data);

    const app = new TradeApp(session, initialItemId);
    app.render(true);
  }

  _onTradeUpdate({ session: data }) {
    const session = globalThis.simpleTrade.sessions[data.id];
    if (!session) return;

    session.updateFromJSON(data);
    this._refreshApp(data.id);
  }

  _onTradeExecuted({ sessionId }) {
    const session = globalThis.simpleTrade.sessions[sessionId];
    if (!session) return;

    this._closeApp(sessionId);
    session.destroy();
  }

  _onTradeCancel({ sessionId }) {
    const session = globalThis.simpleTrade.sessions[sessionId];
    if (!session) return;

    ui.notifications.info("Trade cancelled.");
    this._closeApp(sessionId);
    session.destroy();
  }

  // ─── App helpers ─────────────────────────────────────────────────────────

  _findApp(sessionId) {
    return Object.values(ui.windows).find(
      w => w instanceof TradeApp && w.session?.id === sessionId
    );
  }

  _refreshApp(sessionId) {
    this._findApp(sessionId)?.render(false);
  }

  _closeApp(sessionId) {
    this._findApp(sessionId)?.close({ noSocket: true });
  }
}

// Instantiate on ready
Hooks.once("ready", () => {
  new TradeSocket();
  console.log("simple-token-trade | Socket handler ready");
});
