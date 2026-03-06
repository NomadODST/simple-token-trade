Hooks.once("ready",()=>{

if(!game.simpleTrade.sessions)
game.simpleTrade.sessions={};

game.socket.on("module.simple-token-trade",(data)=>{

const session=game.simpleTrade.sessions[data.id];

if(!session) return;

Object.assign(session,data.state);

session.app.render();

});

game.simpleTrade.sync=function(session){

game.socket.emit("module.simple-token-trade",{
id:session.id,
state:session.serialize()
});

};

});
