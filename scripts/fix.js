Hooks.once("ready", () => {

  const hookName = "tidy5e-sheet.renderActorSheet";

  const hooks = Hooks._hooks?.[hookName];
  if (!hooks) {
    console.log("Lets Trade Fix | No tidy5e hook found.");
    return;
  }

  const filtered = hooks.filter(h => {
    try {
      return !String(h.fn).toLowerCase().includes("lets");
    } catch {
      return true;
    }
  });

  Hooks._hooks[hookName] = filtered;

  console.log("Lets Trade Fix | Removed incompatible Lets Trade sheet injection.");
});
