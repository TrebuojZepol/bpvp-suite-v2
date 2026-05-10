"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type BookLevel = { price: number; size: number };

export type MarketSnapshot = {
  bids: BookLevel[];
  asks: BookLevel[];
  lastPrice: number;
  mid: number;
};

const WS_URL =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_WS_URL
    ? process.env.NEXT_PUBLIC_WS_URL
    : "ws://localhost:8080/ws";

export function useMarketData(pair = "BTC-USD") {
  const [connected, setConnected] = useState(false);
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let ws: WebSocket;
    try {
      ws = new WebSocket(WS_URL);
    } catch (e) {
      setError("websocket_unavailable");
      setConnected(false);
      return;
    }
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setError(null);
      ws.send(JSON.stringify({ type: "subscribe", pair }));
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(String(ev.data)) as Partial<MarketSnapshot> & { type?: string };
        if (msg.bids && msg.asks) {
          setSnapshot({
            bids: msg.bids,
            asks: msg.asks,
            lastPrice: msg.lastPrice ?? msg.mid ?? 0,
            mid: msg.mid ?? 0,
          });
        }
      } catch {
        /* ignore parse errors */
      }
    };

    ws.onerror = () => {
      setError("socket_error");
      setConnected(false);
    };

    ws.onclose = () => {
      setConnected(false);
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [pair]);

  const mockFallback = useMemo((): MarketSnapshot => {
    const bids: BookLevel[] = Array.from({ length: 12 }, (_, i) => ({
      price: 67200 - i * 5,
      size: 0.12 + i * 0.02,
    }));
    const asks: BookLevel[] = Array.from({ length: 12 }, (_, i) => ({
      price: 67205 + i * 5,
      size: 0.1 + i * 0.015,
    }));
    return { bids, asks, lastPrice: 67202.5, mid: 67202.5 };
  }, []);

  return {
    connected,
    error,
    snapshot: snapshot ?? mockFallback,
    usingMock: !connected || !!error,
  };
}
