Hooks.once("init",()=>{

if(!game.simpleTrade) game.simpleTrade={};

});

Hooks.on("renderTokenHUD",(hud,html)=>{

const token=hud.object;
if(!token.actor) return;

const btn=$(`<div class="control-icon trade"><i class="fas fa-handshake"></i></div>`);

btn.click(()=>game.simpleTrade.startTrade(token));

html.find(".right").append(btn);

});


Hooks.on("getSceneControlButtons",()=>{});


Hooks.on("getTokenContextOptions",(token,options)=>{

options.push({
name:"Trade",
icon:'<i class="fas fa-handshake"></i>',
callback:li=>{

const token=canvas.tokens.get(li.data("tokenId"));
game.simpleTrade.startTrade(token);

}
});

});


game.simpleTrade.startTrade=function(sourceToken){

if(!game.users.some(u=>u.isGM && u.active)){

ui.notifications.warn("GM must be online for trading.");

return;

}

const targets=canvas.tokens.controlled.filter(t=>t.id!==sourceToken.id);

if(!targets.length){

ui.notifications.warn("Select a second token.");

return;

}

const target=targets[0];

const session=new game.simpleTrade.TradeSession(sourceToken.actor,target.actor);

session.open();

};
