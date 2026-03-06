globalThis.simpleTrade = globalThis.simpleTrade || {};

class TradeApp extends Application {

  constructor(session) {
    super();
    this.session = session;
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "trade-window",
      template: "modules/simple-token-trade/templates/trade-window.html",
      width: 950,
      height: 650,
      resizable: true,
      dragDrop: [{ dragSelector: ".item", dropSelector: ".trade-container" }]
    });
  }

  getInventory(actor) {

    const allowed = [
      "weapon",
      "equipment",
      "consumable",
      "tool",
      "loot",
      "container",
      "backpack"
    ];

    return actor.items
      .filter(i => allowed.includes(i.type))
      .map(i => {

        const qty = i.system.quantity ?? 1;

        let price = 0;

        if (i.system.price?.value)
          price = i.system.price.value;

        if (i.system.price?.gp)
          price = i.system.price.gp;

        return {
          id: i.id,
          name: i.name,
          img: i.img,
          quantity: qty,
          price: price,
          item: i
        };

      });

  }

  getData() {

    const s = this.session;

    return {
      actorA: s.actorA,
      actorB: s.actorB,

      itemsA: this.getInventory(s.actorA),
      itemsB: this.getInventory(s.actorB),

      offerA: s.offerA,
      offerB: s.offerB,

      goldA: s.goldA,
      goldB: s.goldB,

      acceptA: s.acceptA,
      acceptB: s.acceptB
    };

  }

  activateListeners(html) {

    super.activateListeners(html);

    const s = this.session;

    html.find(".item").click(ev => {

      const id = ev.currentTarget.dataset.id;
      const side = ev.currentTarget.dataset.side;

      this.addItem(id, side);

    });

    html.find(".gold-a").change(ev => {

      s.goldA = Number(ev.target.value);
      s.resetAccept();
      game.simpleTrade.sync(s);

    });

    html.find(".gold-b").change(ev => {

      s.goldB = Number(ev.target.value);
      s.resetAccept();
      game.simpleTrade.sync(s);

    });

    html.find(".accept-a").click(() => {

      s.acceptA = true;
      game.simpleTrade.sync(s);
      this.checkTrade();

    });

    html.find(".accept-b").click(() => {

      s.acceptB = true;
      game.simpleTrade.sync(s);
      this.checkTrade();

    });

    html.find(".cancel").click(() => this.close());

  }

  async _onDrop(event) {

    const data = TextEditor.getDragEventData(event);

    if (data.type !== "Item") return;

    const item = await fromUuid(data.uuid);

    if (!item) return;

    const actor = item.parent;

    const side = actor.id === this.session.actorA.id ? "A" : "B";

    this.addItem(item.id, side);

  }

  async addItem(itemId, side) {

    const s = this.session;

    const actor = side === "A" ? s.actorA : s.actorB;

    const item = actor.items.get(itemId);
    if (!item) return;

    const max = item.system.quantity ?? 1;

    let qty;

    try {

      qty = await Dialog.prompt({
        title: "Quantity",
        content: `<input type="number" value="1" min="1" max="${max}">`,
        callback: html => Number(html.find("input").val())
      });

    } catch {
      return;
    }

    if (!qty || qty <= 0) return;

    const offer = side === "A" ? s.offerA : s.offerB;

    const existing = offer.find(o => o.id === itemId);

    if (existing)
      existing.qty += qty;
    else
      offer.push({ id: itemId, qty });

    s.resetAccept();

    game.simpleTrade.sync(s);

    this.render();

  }

  async checkTrade() {

    const s = this.session;

    if (!(s.acceptA && s.acceptB)) return;

    await this.executeTrade();

    ui.notifications.info("Trade completed.");

    this.close();

  }

  async executeTrade() {

    const s = this.session;

    await this.transferItems(s.actorA, s.actorB, s.offerA);
    await this.transferItems(s.actorB, s.actorA, s.offerB);

    await this.transferGold(s);

  }

  async transferItems(fromActor, toActor, offers) {

    for (let o of offers) {

      const item = fromActor.items.get(o.id);
      if (!item) continue;

      const qty = o.qty;
      const current = item.system.quantity ?? 1;

      const existing = toActor.items.find(i =>
        i.name === item.name && i.type === item.type
      );

      if (existing) {

        await existing.update({
          "system.quantity": (existing.system.quantity ?? 1) + qty
        });

      } else {

        const itemData = item.toObject();
        itemData.system.quantity = qty;

        await toActor.createEmbeddedDocuments("Item", [itemData]);

      }

      if (current > qty) {

        await item.update({
          "system.quantity": current - qty
        });

      } else {

        await item.delete();

      }

    }

  }

  async transferGold(session) {

    const a = session.actorA;
    const b = session.actorB;

    if (session.goldA) {

      await a.update({
        "system.currency.gp": a.system.currency.gp - session.goldA
      });

      await b.update({
        "system.currency.gp": b.system.currency.gp + session.goldA
      });

    }

    if (session.goldB) {

      await b.update({
        "system.currency.gp": b.system.currency.gp - session.goldB
      });

      await a.update({
        "system.currency.gp": a.system.currency.gp + session.goldB
      });

    }

  }

}

globalThis.simpleTrade.TradeApp = TradeApp;
