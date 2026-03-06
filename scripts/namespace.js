globalThis.simpleTrade = globalThis.simpleTrade || {};

Hooks.once("init", () => {

  game.simpleTrade = globalThis.simpleTrade;

  game.simpleTrade.sessions = {};

  console.log("Simple Token Trade | Namespace ready");

});
