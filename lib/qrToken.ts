import { createHmac } from "crypto";

const WINDOW_SECONDS = 30;

function currentWindow(date: number = Date.now()): number {
  return Math.floor(date / (WINDOW_SECONDS * 1000));
}

function tokenForWindow(sessionId: string, window: number): string {
  const secret = process.env.QR_TOKEN_SECRET;
  if (!secret) {
    throw new Error("QR_TOKEN_SECRET is not set");
  }
  return createHmac("sha256", secret)
    .update(`${sessionId}:${window}`)
    .digest("hex")
    .slice(0, 8);
}

export function generateQrToken(sessionId: string): string {
  return tokenForWindow(sessionId, currentWindow());
}

export function verifyQrToken(sessionId: string, token: string): boolean {
  const window = currentWindow();
  // 允许当前窗口和上一个窗口，给扫码到提交之间的延迟留余量
  return (
    token === tokenForWindow(sessionId, window) ||
    token === tokenForWindow(sessionId, window - 1)
  );
}
