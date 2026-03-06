Hooks.once("init", () => {

  if (!game.simpleTrade) game.simpleTrade = {};

  console.log("Simple Token Trade | Init");

});


Hooks.once("ready", () => {

  // Start Trade Function
  game.simpleTrade.startTrade = function(sourceToken) {

    if (!game.users.some(u => u.isGM && u.active)) {
      ui.notifications.warn("GM must be online for trading.");
      return;
    }

    const targets = canvas.tokens.controlled.filter(t => t.id !== sourceToken.id);

    if (!targets.length) {
      ui.notifications.warn("Select another token to trade with.");
      return;
    }

    const targetToken = targets[0];

    const session = new game.simpleTrade.TradeSession(
      sourceToken.actor,
      targetToken.actor
    );

    session.open();
  };

});


/* TOKEN HUD BUTTON */

Hooks.on("renderTokenHUD", (hud, html) => {

  const token = hud.object;
  if (!token.actor) return;

  const btn = $(`<div class="control-icon trade"><i class="fas fa-handshake"></i></div>`);

  btn.click(() => game.simpleTrade.startTrade(token));

  html.find(".right").append(btn);

});


/* RIGHT CLICK TOKEN MENU */

Hooks.on("getTokenContextOptions", (token, options) => {

  options.push({
    name: "Trade",
    icon: '<i class="fas fa-handshake"></i>',
    callback: li => {

      const token = canvas.tokens.get(li.data("tokenId"));

      game.simpleTrade.startTrade(token);

    }
  });

});
