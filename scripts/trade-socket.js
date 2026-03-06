Hooks.once("ready",()=>{

 if(!game.simpleTrade) game.simpleTrade={};

 game.simpleTrade.sessions={};

 game.socket.on("module.simple-token-trade",(data)=>{

   const session=game.simpleTrade.sessions[data.id];
   if(!session) return;

   session.receiveSocket(data);

 });

 game.simpleTrade.send=(payload)=>{

   game.socket.emit("module.simple-token-trade",payload);

 };

 game.simpleTrade.startSession=(a,b)=>{

   const id=randomID();

   const session=new game.simpleTrade.TradeApp(a,b,id);

   game.simpleTrade.sessions[id]=session;

   session.render(true);

 };

});
