// Minimal IMAP4rev1 client for the Deno edge runtime.
// Supports: LOGIN, SELECT, UID SEARCH SINCE, UID FETCH headers + text.

export interface ImapConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  useSsl: boolean;
}

export interface ImapMessage {
  uid: number;
  messageId: string;
  from: string;
  subject: string;
  date: string;
  bodyText: string;
}

const encoder = new TextEncoder();

// Decode RFC 2047 encoded-words in headers: =?charset?B|Q?data?=
function decodeEncodedWords(value: string): string {
  return value.replace(
    /=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g,
    (_match, charset: string, enc: string, data: string) => {
      try {
        let bytes: Uint8Array;
        if (enc.toUpperCase() === "B") {
          const bin = atob(data);
          bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        } else {
          const qp = data.replace(/_/g, " ").replace(/=([0-9A-Fa-f]{2})/g, (_m, h) =>
            String.fromCharCode(parseInt(h, 16))
          );
          bytes = new Uint8Array(qp.length);
          for (let i = 0; i < qp.length; i++) bytes[i] = qp.charCodeAt(i);
        }
        return new TextDecoder(charset.toLowerCase(), { fatal: false }).decode(bytes);
      } catch {
        return data;
      }
    }
  );
}

function decodeQuotedPrintable(text: string): string {
  const joined = text.replace(/=\r?\n/g, "");
  const bytes: number[] = [];
  for (let i = 0; i < joined.length; i++) {
    if (joined[i] === "=" && /[0-9A-Fa-f]{2}/.test(joined.slice(i + 1, i + 3))) {
      bytes.push(parseInt(joined.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      bytes.push(joined.charCodeAt(i));
    }
  }
  return new TextDecoder("utf-8", { fatal: false }).decode(new Uint8Array(bytes));
}

function decodeBase64Text(text: string): string {
  try {
    const bin = atob(text.replace(/\s+/g, ""));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  } catch {
    return text;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

// Best-effort extraction of readable text from a raw message body,
// which may be a bare body or a multipart MIME payload.
export function extractReadableText(headers: string, rawBody: string): string {
  const contentType = /content-type:\s*([^\r\n;]+)/i.exec(headers)?.[1]?.trim().toLowerCase() || "";
  const boundaryMatch = /boundary="?([^"\r\n;]+)"?/i.exec(headers);

  if (boundaryMatch && contentType.startsWith("multipart/")) {
    const parts = rawBody.split(new RegExp(`--${boundaryMatch[1].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    let htmlFallback = "";
    for (const part of parts) {
      const sep = part.indexOf("\r\n\r\n");
      if (sep === -1) continue;
      const partHeaders = part.slice(0, sep);
      let partBody = part.slice(sep + 4);
      const cte = /content-transfer-encoding:\s*([^\r\n]+)/i.exec(partHeaders)?.[1]?.trim().toLowerCase();
      if (cte === "quoted-printable") partBody = decodeQuotedPrintable(partBody);
      else if (cte === "base64") partBody = decodeBase64Text(partBody);
      if (/content-type:\s*text\/plain/i.test(partHeaders)) {
        return partBody.trim();
      }
      if (/content-type:\s*text\/html/i.test(partHeaders) && !htmlFallback) {
        htmlFallback = stripHtml(partBody);
      }
      // Nested multipart: recurse one level
      if (/content-type:\s*multipart\//i.test(partHeaders)) {
        const nested = extractReadableText(partHeaders, partBody);
        if (nested) return nested;
      }
    }
    if (htmlFallback) return htmlFallback;
  }

  const cte = /content-transfer-encoding:\s*([^\r\n]+)/i.exec(headers)?.[1]?.trim().toLowerCase();
  let text = rawBody;
  if (cte === "quoted-printable") text = decodeQuotedPrintable(text);
  else if (cte === "base64") text = decodeBase64Text(text);
  if (contentType.includes("text/html")) text = stripHtml(text);
  return text.trim();
}

export class ImapClient {
  private conn!: Deno.Conn;
  private buffer = new Uint8Array(0);
  private tagCounter = 0;

  async connect(config: ImapConfig): Promise<void> {
    if (config.useSsl) {
      this.conn = await Deno.connectTls({ hostname: config.host, port: config.port });
    } else {
      this.conn = await Deno.connect({ hostname: config.host, port: config.port });
    }
    await this.readLine(); // server greeting
  }

  private async fill(): Promise<void> {
    const chunk = new Uint8Array(16384);
    const n = await this.conn.read(chunk);
    if (n === null) throw new Error("Connection closed by server");
    const merged = new Uint8Array(this.buffer.length + n);
    merged.set(this.buffer);
    merged.set(chunk.subarray(0, n), this.buffer.length);
    this.buffer = merged;
  }

  private async readLine(): Promise<string> {
    for (;;) {
      const idx = this.buffer.indexOf(0x0a); // \n
      if (idx !== -1) {
        const line = new TextDecoder("utf-8", { fatal: false }).decode(this.buffer.subarray(0, idx + 1));
        this.buffer = this.buffer.subarray(idx + 1);
        return line.replace(/\r?\n$/, "");
      }
      await this.fill();
    }
  }

  private async readBytes(n: number): Promise<Uint8Array> {
    while (this.buffer.length < n) await this.fill();
    const out = this.buffer.subarray(0, n);
    this.buffer = this.buffer.subarray(n);
    return out;
  }

  // Send a command; collect untagged lines (with literals inlined) until the tagged response.
  private async command(cmd: string): Promise<{ ok: boolean; lines: string[]; literals: Uint8Array[]; statusLine: string }> {
    const tag = `A${++this.tagCounter}`;
    await this.conn.write(encoder.encode(`${tag} ${cmd}\r\n`));

    const lines: string[] = [];
    const literals: Uint8Array[] = [];
    for (;;) {
      let line = await this.readLine();
      // Inline literals: a line ending in {N} is followed by N raw bytes
      let litMatch = /\{(\d+)\}$/.exec(line);
      while (litMatch) {
        const lit = await this.readBytes(parseInt(litMatch[1], 10));
        literals.push(lit);
        line += `<LITERAL:${literals.length - 1}>`;
        const cont = await this.readLine();
        line += cont;
        litMatch = /\{(\d+)\}$/.exec(cont);
      }
      if (line.startsWith(`${tag} `)) {
        return { ok: line.startsWith(`${tag} OK`), lines, literals, statusLine: line };
      }
      lines.push(line);
    }
  }

  private quote(value: string): string {
    return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  }

  async login(username: string, password: string): Promise<void> {
    const res = await this.command(`LOGIN ${this.quote(username)} ${this.quote(password)}`);
    if (!res.ok) throw new Error(`IMAP login failed: ${res.statusLine.replace(/^A\d+ /, "")}`);
  }

  async select(mailbox: string): Promise<number> {
    const res = await this.command(`SELECT ${this.quote(mailbox)}`);
    if (!res.ok) throw new Error(`Cannot open mailbox "${mailbox}"`);
    const existsLine = res.lines.find((l) => /^\* \d+ EXISTS/.test(l));
    return existsLine ? parseInt(existsLine.split(" ")[1], 10) : 0;
  }

  async searchSince(date: Date | null): Promise<number[]> {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const criteria = date
      ? `SINCE ${date.getUTCDate()}-${months[date.getUTCMonth()]}-${date.getUTCFullYear()}`
      : "ALL";
    const res = await this.command(`UID SEARCH ${criteria}`);
    if (!res.ok) throw new Error("IMAP search failed");
    const searchLine = res.lines.find((l) => l.startsWith("* SEARCH"));
    if (!searchLine) return [];
    return searchLine
      .slice(9)
      .split(" ")
      .map((s) => parseInt(s, 10))
      .filter((n) => !isNaN(n));
  }

  async fetchMessages(uids: number[]): Promise<ImapMessage[]> {
    if (uids.length === 0) return [];
    const res = await this.command(
      `UID FETCH ${uids.join(",")} (UID BODY.PEEK[HEADER.FIELDS (FROM SUBJECT DATE MESSAGE-ID CONTENT-TYPE CONTENT-TRANSFER-ENCODING)] BODY.PEEK[TEXT]<0.65536>)`
    );
    if (!res.ok) throw new Error("IMAP fetch failed");

    const messages: ImapMessage[] = [];
    // Each FETCH item references two literals in order: headers, then body text
    const decoder = new TextDecoder("utf-8", { fatal: false });
    for (const line of res.lines) {
      if (!/^\* \d+ FETCH /.test(line)) continue;
      const uidMatch = /UID (\d+)/.exec(line);
      const litRefs = [...line.matchAll(/<LITERAL:(\d+)>/g)].map((m) => parseInt(m[1], 10));
      if (!uidMatch || litRefs.length < 1) continue;

      const headers = decoder.decode(res.literals[litRefs[0]]);
      const rawBody = litRefs.length > 1 ? decoder.decode(res.literals[litRefs[1]]) : "";

      const header = (name: string) => {
        // Unfold continuation lines, then match
        const unfolded = headers.replace(/\r?\n[ \t]+/g, " ");
        const m = new RegExp(`^${name}:\\s*(.*)$`, "im").exec(unfolded);
        return m ? decodeEncodedWords(m[1].trim()) : "";
      };

      messages.push({
        uid: parseInt(uidMatch[1], 10),
        messageId: header("Message-ID").replace(/^<|>$/g, ""),
        from: header("From"),
        subject: header("Subject"),
        date: header("Date"),
        bodyText: extractReadableText(headers, rawBody),
      });
    }
    return messages;
  }

  async logout(): Promise<void> {
    try {
      await this.command("LOGOUT");
    } catch {
      // ignore errors during logout
    }
    try {
      this.conn.close();
    } catch {
      // already closed
    }
  }
}
