Hooks.once("init", () => {
  console.log("Simple Token Trade | Loaded");
});


/* TOKEN RIGHT CLICK */

Hooks.on("getSceneControlButtons", () => {});


Hooks.on("canvasReady", () => {

  Hooks.on("getSceneControlButtons", () => {});

});


Hooks.on("renderTokenHUD", (hud, html) => {

  const token = hud.object;
  if (!token.actor) return;

  const btn = $(`
    <div class="control-icon trade">
      <i class="fas fa-handshake"></i>
    </div>
  `);

  btn.click(() => openTrade(token.actor));

  html.find(".right").append(btn);

});


/* OPEN TRADE WINDOW */

async function openTrade(sourceActor) {

  const targets = canvas.tokens.controlled
    .map(t => t.actor)
    .filter(a => a && a.id !== sourceActor.id);

  if (!targets.length) {
    ui.notifications.warn("Select a second token.");
    return;
  }

  const targetActor = targets[0];

  const html = await renderTemplate(
    "modules/simple-token-trade/templates/trade-window.html",
    {
      source: sourceActor,
      target: targetActor,
      sourceItems: sourceActor.items.contents,
      targetItems: targetActor.items.contents
    }
  );

  const dlg = new Dialog({

    title: `Trade: ${sourceActor.name} ⇄ ${targetActor.name}`,
    content: html,

    buttons: {
      close: {
        label: "Close"
      }
    },

    render: html => activateTrade(html, sourceActor, targetActor)

  });

  dlg.render(true);

}


/* TRADE INTERACTION */

function activateTrade(html, source, target) {

  html.find(".give-item").click(async ev => {

    const itemId = ev.currentTarget.dataset.item;

    const item = source.items.get(itemId);
    if (!item) return;

    const data = item.toObject();
    await target.createEmbeddedDocuments("Item", [data]);

    const qty = item.system.quantity ?? 1;

    if (qty <= 1) {
      await item.delete();
    } else {
      await item.update({
        "system.quantity": qty - 1
      });
    }

    ui.notifications.info(`${source.name} gives ${item.name}`);

  });


  html.find(".take-item").click(async ev => {

    const itemId = ev.currentTarget.dataset.item;

    const item = target.items.get(itemId);
    if (!item) return;

    const data = item.toObject();
    await source.createEmbeddedDocuments("Item", [data]);

    const qty = item.system.quantity ?? 1;

    if (qty <= 1) {
      await item.delete();
    } else {
      await item.update({
        "system.quantity": qty - 1
      });
    }

    ui.notifications.info(`${source.name} receives ${item.name}`);

  });


  html.find(".trade-gold").click(async () => {

    const gold = Number(html.find('[name="gold"]').val());

    const src = source.system.currency.gp ?? 0;
    const tgt = target.system.currency.gp ?? 0;

    if (src < gold) {
      ui.notifications.warn("Not enough gold.");
      return;
    }

    await source.update({
      "system.currency.gp": src - gold
    });

    await target.update({
      "system.currency.gp": tgt + gold
    });

    ui.notifications.info(`${gold} gold transferred`);

  });

}
