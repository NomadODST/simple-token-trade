class TradeApp extends Application {

 constructor(source,target){
  super();
  this.source=source;
  this.target=target;
  this.offerA=[];
  this.offerB=[];
  this.goldA=0;
  this.goldB=0;
 }

 static get defaultOptions(){
  return mergeObject(super.defaultOptions,{
   id:"trade-window",
   template:"modules/simple-token-trade/templates/trade-window.html",
   width:700,
   height:"auto",
   resizable:true
  });
 }

 getData(){

  return{
   source:this.source,
   target:this.target,
   itemsA:this.source.items.contents,
   itemsB:this.target.items.contents,
   offerA:this.offerA,
   offerB:this.offerB,
   goldA:this.goldA,
   goldB:this.goldB
  };

 }

 activateListeners(html){

  html.find(".item-a").click(ev=>{
   const id=ev.currentTarget.dataset.id;
   this.offerA.push(id);
   this.render();
  });

  html.find(".item-b").click(ev=>{
   const id=ev.currentTarget.dataset.id;
   this.offerB.push(id);
   this.render();
  });

  html.find(".gold-a").change(ev=>{
   this.goldA=Number(ev.target.value);
  });

  html.find(".gold-b").change(ev=>{
   this.goldB=Number(ev.target.value);
  });

  html.find(".accept-trade").click(()=>this.executeTrade());

 }

 async executeTrade(){

  for(const id of this.offerA){
   const item=this.source.items.get(id);
   const data=item.toObject();
   await this.target.createEmbeddedDocuments("Item",[data]);
   await item.delete();
  }

  for(const id of this.offerB){
   const item=this.target.items.get(id);
   const data=item.toObject();
   await this.source.createEmbeddedDocuments("Item",[data]);
   await item.delete();
  }

  const gpA=this.source.system.currency.gp||0;
  const gpB=this.target.system.currency.gp||0;

  await this.source.update({"system.currency.gp":gpA-this.goldA+this.goldB});
  await this.target.update({"system.currency.gp":gpB-this.goldB+this.goldA});

  ui.notifications.info("Trade complete.");

  this.close();

 }

}

if(!game.simpleTrade) game.simpleTrade={};
game.simpleTrade.TradeApp=TradeApp;
