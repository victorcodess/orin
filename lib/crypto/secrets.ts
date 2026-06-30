import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function encryptionKey(): Buffer {
  const secret = process.env.API_KEY_ENCRYPTION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "API_KEY_ENCRYPTION_SECRET must be set to at least 32 characters",
    );
  }

  return Buffer.from(secret.slice(0, 32), "utf8");
}

export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptSecret(payload: string): string {
  const [ivPart, tagPart, dataPart] = payload.split(".");

  if (!ivPart || !tagPart || !dataPart) {
    throw new Error("Invalid encrypted secret payload");
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    encryptionKey(),
    Buffer.from(ivPart, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagPart, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(dataPart, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function maskSecret(value: string): string {
  const trimmed = value.trim();

  if (trimmed.length <= 8) {
    return "••••••••";
  }

  return `${trimmed.slice(0, 3)}…${trimmed.slice(-4)}`;
}
