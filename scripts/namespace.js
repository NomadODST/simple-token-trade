/**
 * simple-token-trade | namespace.js
 * Initializes the global namespace and registers the socket on init.
 */

Hooks.once("init", () => {
  globalThis.simpleTrade = {
    sessions: {},
    socket: null,
  };

  // Register module socket
  game.socket.on("module.simple-token-trade", (data) => {
    globalThis.simpleTrade.socket?.handle(data);
  });

  console.log("simple-token-trade | Initialized");
});
