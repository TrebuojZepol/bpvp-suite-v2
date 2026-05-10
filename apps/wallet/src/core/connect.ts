import WebSocket from "ws";

type WsMsg = { type: string; nonce?: string; [key: string]: unknown };

export class DashboardConnection {
  private socket: WebSocket | null = null;
  private readonly signNonce: (nonce: string) => Promise<string>;
  private closed = false;

  constructor(
    private readonly url: string,
    signNonce: (nonce: string) => Promise<string>,
    private readonly connectTimeoutMs: number = 30_000,
  ) {
    this.signNonce = signNonce;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.closed) {
        reject(new Error("connection closed"));
        return;
      }
      const ws = new WebSocket(this.url);
      this.socket = ws;
      const timer = setTimeout(() => {
        ws.close();
        reject(new Error("websocket connect timeout"));
      }, this.connectTimeoutMs);

      ws.once("open", () => {
        clearTimeout(timer);
        resolve();
      });

      ws.once("error", (err) => {
        clearTimeout(timer);
        reject(err instanceof Error ? err : new Error(String(err)));
      });

      ws.on("message", (data) => {
        void this.onRawMessage(data);
      });
    });
  }

  private async onRawMessage(data: WebSocket.RawData) {
    let msg: WsMsg;
    try {
      const text = typeof data === "string" ? data : data.toString("utf8");
      msg = JSON.parse(text) as WsMsg;
    } catch {
      return;
    }
    if (msg.type === "challenge" && typeof msg.nonce === "string") {
      try {
        const signature = await this.signNonce(msg.nonce);
        this.send({ type: "challenge_response", nonce: msg.nonce, signature });
      } catch {
        /* signing failed */
      }
    }
  }

  private send(obj: object) {
    const ws = this.socket;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(obj));
    }
  }

  disconnect() {
    this.closed = true;
    const ws = this.socket;
    this.socket = null;
    if (ws) {
      try {
        ws.close();
      } catch {
        /* ignore */
      }
    }
  }
}
