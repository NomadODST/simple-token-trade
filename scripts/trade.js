Hooks.once("init", () => {
  console.log("Simple Token Trade V3.5 Loaded");
});

Hooks.on("renderTokenHUD",(hud,html)=>{

  const token=hud.object;
  if(!token.actor) return;

  const btn=$(`<div class="control-icon trade"><i class="fas fa-handshake"></i></div>`);

  btn.click(()=>startTrade(token));

  html.find(".right").append(btn);

});

function startTrade(sourceToken){

  const targets=canvas.tokens.controlled.filter(t=>t.id!==sourceToken.id);

  if(!targets.length){
    ui.notifications.warn("Select another token to trade with.");
    return;
  }

  const targetToken=targets[0];

  game.simpleTrade.startSession(sourceToken.actor,targetToken.actor);

}
