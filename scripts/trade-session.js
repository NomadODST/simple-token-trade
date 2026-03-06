class TradeSession{

constructor(a,b){

this.id=randomID();

this.actorA=a;
this.actorB=b;

this.offerA=[];
this.offerB=[];

this.goldA=0;
this.goldB=0;

this.acceptA=false;
this.acceptB=false;

}

open(){

this.app=new game.simpleTrade.TradeApp(this);

this.app.render(true);

game.simpleTrade.sessions[this.id]=this;

}

resetAccept(){

this.acceptA=false;
this.acceptB=false;

}

serialize(){

return{
offerA:this.offerA,
offerB:this.offerB,
goldA:this.goldA,
goldB:this.goldB,
acceptA:this.acceptA,
acceptB:this.acceptB
};

}

}

if(!game.simpleTrade) game.simpleTrade={};
game.simpleTrade.TradeSession=TradeSession;
