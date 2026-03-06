Hooks.on("getActorDirectoryEntryContext", () => {});

/* TOKEN CONTEXT MENU */

Hooks.on("getSceneControlButtons", () => {});

Hooks.on("init", () => {
  console.log("Simple Token Trade | Initialized");
});


/* ADD TOKEN RIGHT CLICK MENU */

Hooks.on("getSceneControlButtons", () => {});


Hooks.on("canvasReady", () => {

  Hooks.on("getSceneControlButtons", () => {});

});


/* REGISTER TOKEN CONTEXT MENU */

Hooks.on("getSceneControlButtons", () => {});


Hooks.on("renderTokenHUD", (hud, html, data) => {

  const token = hud.object;
  const actor = token.actor;

  if (!actor) return;

  const button = $(`
    <div class="control-icon trade">
      <i class="fas fa-handshake"></i>
    </div>
  `);

  button.click(() => openTradeDialog(actor));

  html.find(".right").append(button);

});


/* TRADE DIALOG */

async function openTradeDialog(sourceActor) {

  const targets = canvas.tokens.controlled
    .map(t => t.actor)
    .filter(a => a && a.id !== sourceActor.id);

  if (!targets.length) {
    ui.notifications.warn("Select another token to trade with.");
    return;
  }

  const targetActor = targets[0];

  const items = sourceActor.items
    .filter(i => i.type === "loot" || i.type === "consumable" || i.type === "equipment");

  let itemOptions = items.map(i =>
    `<option value="${i.id}">${i.name}</option>`
  ).join("");

  const html = `
  <form>
    <div class="form-group">
      <label>Item</label>
      <select name="item">${itemOptions}</select>
    </div>

    <div class="form-group">
      <label>Quantity</label>
      <input type="number" name="qty" value="1"/>
    </div>

    <div class="form-group">
      <label>Gold</label>
      <input type="number" name="gold" value="0"/>
    </div>
  </form>
  `;

  new Dialog({

    title: `Trade with ${targetActor.name}`,

    content: html,

    buttons: {

      trade: {
        label: "Trade",
        callback: async (dlg) => {

          const itemId = dlg.find('[name="item"]').val();
          const qty = Number(dlg.find('[name="qty"]').val());
          const gold = Number(dlg.find('[name="gold"]').val());

          await transferItem(sourceActor, targetActor, itemId, qty);

          if (gold > 0) {
            await transferGold(sourceActor, targetActor, gold);
          }

          ui.notifications.info("Trade complete.");

        }
      }

    }

  }).render(true);

}


/* ITEM TRANSFER */

async function transferItem(source, target, itemId, qty) {

  const item = source.items.get(itemId);
  if (!item) return;

  const itemData = item.toObject();

  itemData.system.quantity = qty;

  await target.createEmbeddedDocuments("Item", [itemData]);

  const remaining = item.system.quantity - qty;

  if (remaining <= 0) {

    await item.delete();

  } else {

    await item.update({
      "system.quantity": remaining
    });

  }

}


/* GOLD TRANSFER */

async function transferGold(source, target, amount) {

  const srcGold = source.system.currency.gp || 0;
  const tgtGold = target.system.currency.gp || 0;

  if (srcGold < amount) {
    ui.notifications.warn("Not enough gold.");
    return;
  }

  await source.update({
    "system.currency.gp": srcGold - amount
  });

  await target.update({
    "system.currency.gp": tgtGold + amount
  });

}
