/**
 * Bale Messenger Bot API Client
 * Docs: https://docs.bale.ai/
 * Base: https://tapi.bale.ai/bot{token}/{METHOD}
 *
 * Compatible with Telegram Bot API style.
 * sendMessage: POST with chat_id + text
 */

export interface BaleConfig {
  enabled: boolean;
  botToken: string;
  chatId: string; // numeric chat id or @channelusername
  notifyOnInvoice: boolean;
  notifyOnMoadian: boolean;
  notifyOnLowStock: boolean;
  notifyOnCheque: boolean;
  notifyOnLogin: boolean;
}

export interface BaleSendResult {
  ok: boolean;
  messageId?: number;
  error?: string;
  description?: string;
  raw?: unknown;
}

const BALE_API = "https://tapi.bale.ai/bot";

function apiUrl(token: string, method: string): string {
  // Token may already include "bot" prefix or not
  const clean = token.replace(/^bot/i, "").trim();
  return `${BALE_API}${clean}/${method}`;
}

/**
 * getMe — validate bot token
 * https://docs.bale.ai/ → getMe
 */
export async function baleGetMe(token: string): Promise<{
  ok: boolean;
  bot?: { id: number; first_name: string; username?: string };
  error?: string;
}> {
  if (!token?.trim()) {
    return { ok: false, error: "توکن بازو وارد نشده است" };
  }
  try {
    const res = await fetch(apiUrl(token, "getMe"), {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    const json = await res.json();
    if (json.ok && json.result) {
      return {
        ok: true,
        bot: {
          id: json.result.id,
          first_name: json.result.first_name,
          username: json.result.username,
        },
      };
    }
    return {
      ok: false,
      error: json.description || `خطا: ${json.error_code || res.status}`,
    };
  } catch (err) {
    return {
      ok: false,
      error: `ارتباط با سرور بله برقرار نشد: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * sendMessage — ارسال پیام متنی
 * https://docs.bale.ai/#sendmessage
 * chat_id: String | Integer (required)
 * text: 1–4096 chars (required)
 */
export async function baleSendMessage(
  token: string,
  chatId: string | number,
  text: string,
  options?: {
    reply_markup?: unknown;
    reply_to_message_id?: number;
  }
): Promise<BaleSendResult> {
  if (!token?.trim()) {
    return { ok: false, error: "توکن بازو تنظیم نشده" };
  }
  if (!chatId && chatId !== 0) {
    return { ok: false, error: "شناسه چت (Chat ID) تنظیم نشده" };
  }
  if (!text?.trim()) {
    return { ok: false, error: "متن پیام خالی است" };
  }

  // Bale limit ~4096 chars
  const safeText = text.slice(0, 4096);

  try {
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text: safeText,
    };
    if (options?.reply_markup) body.reply_markup = options.reply_markup;
    if (options?.reply_to_message_id) body.reply_to_message_id = options.reply_to_message_id;

    const res = await fetch(apiUrl(token, "sendMessage"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const json = await res.json().catch(() => null);

    if (json?.ok) {
      return {
        ok: true,
        messageId: json.result?.message_id,
        raw: json,
      };
    }

    return {
      ok: false,
      error: json?.description || `خطای بله (${json?.error_code || res.status})`,
      description: json?.description,
      raw: json,
    };
  } catch (err) {
    return {
      ok: false,
      error: `خطای شبکه بله: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * getUpdates — برای پیدا کردن chat_id
 * کاربر باید به بازو پیام بدهد، سپس این متد chat_id را برمی‌گرداند
 */
export async function baleGetUpdates(token: string): Promise<{
  ok: boolean;
  chats?: { chatId: number | string; title: string; type: string; lastMessage?: string }[];
  error?: string;
}> {
  try {
    const res = await fetch(apiUrl(token, "getUpdates") + "?limit=50", {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    const json = await res.json();
    if (!json.ok) {
      return { ok: false, error: json.description || "خطا در دریافت آپدیت‌ها" };
    }

    const map = new Map<string, { chatId: number | string; title: string; type: string; lastMessage?: string }>();
    for (const upd of json.result || []) {
      const msg = upd.message || upd.edited_message || upd.channel_post;
      if (!msg?.chat) continue;
      const c = msg.chat;
      const id = String(c.id);
      const title =
        c.title ||
        [c.first_name, c.last_name].filter(Boolean).join(" ") ||
        c.username ||
        id;
      map.set(id, {
        chatId: c.id,
        title,
        type: c.type || "private",
        lastMessage: msg.text?.slice(0, 80),
      });
    }

    return { ok: true, chats: Array.from(map.values()) };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** Format currency for notifications */
function fmtMoney(n: number): string {
  return new Intl.NumberFormat("fa-IR").format(n) + " ریال";
}

/** Notification message builders */
export const BaleMessages = {
  invoiceCreated(data: {
    number: string;
    customer: string;
    total: number;
    itemsCount: number;
    user: string;
  }) {
    return [
      "🧾 *فاکتور فروش جدید*",
      ``,
      `شماره: ${data.number}`,
      `مشتری: ${data.customer}`,
      `مبلغ: ${fmtMoney(data.total)}`,
      `تعداد اقلام: ${data.itemsCount}`,
      `ثبت‌کننده: ${data.user}`,
      `زمان: ${new Date().toLocaleString("fa-IR")}`,
    ].join("\n");
  },

  moadianSent(data: {
    number: string;
    taxid?: string;
    uid?: string;
    referenceNumber?: string;
    success: boolean;
    mode: string;
    error?: string;
  }) {
    if (data.success) {
      return [
        "✅ *ارسال به سامانه مودیان موفق*",
        ``,
        `فاکتور: ${data.number}`,
        data.taxid ? `شماره مالیاتی: ${data.taxid}` : "",
        data.uid ? `UID: ${data.uid}` : "",
        data.referenceNumber ? `کد پیگیری: ${data.referenceNumber}` : "",
        `حالت: ${data.mode === "demo" ? "دمو" : data.mode === "sandbox" ? "آزمایشی" : "عملیاتی"}`,
        `زمان: ${new Date().toLocaleString("fa-IR")}`,
      ]
        .filter(Boolean)
        .join("\n");
    }
    return [
      "❌ *خطا در ارسال به سامانه مودیان*",
      ``,
      `فاکتور: ${data.number}`,
      data.taxid ? `شماره مالیاتی: ${data.taxid}` : "",
      `خطا: ${data.error || "نامشخص"}`,
      `زمان: ${new Date().toLocaleString("fa-IR")}`,
    ]
      .filter(Boolean)
      .join("\n");
  },

  lowStock(data: { name: string; sku: string; stock: number; reorderPoint: number }) {
    return [
      "⚠️ *هشدار موجودی کالا*",
      ``,
      `کالا: ${data.name}`,
      `SKU: ${data.sku}`,
      `موجودی: ${data.stock}`,
      `نقطه سفارش: ${data.reorderPoint}`,
      `زمان: ${new Date().toLocaleString("fa-IR")}`,
    ].join("\n");
  },

  chequeDue(data: { number: string; party: string; amount: number; dueDate: string; type: string }) {
    return [
      "📋 *یادآوری سررسید چک*",
      ``,
      `شماره چک: ${data.number}`,
      `طرف حساب: ${data.party}`,
      `مبلغ: ${fmtMoney(data.amount)}`,
      `سررسید: ${data.dueDate}`,
      `نوع: ${data.type === "received" ? "دریافتی" : "پرداختی"}`,
      `زمان: ${new Date().toLocaleString("fa-IR")}`,
    ].join("\n");
  },

  userLogin(data: { user: string; role: string }) {
    return [
      "🔐 *ورود به سیستم*",
      ``,
      `کاربر: ${data.user}`,
      `نقش: ${data.role}`,
      `زمان: ${new Date().toLocaleString("fa-IR")}`,
    ].join("\n");
  },

  testMessage() {
    return [
      "✨ *پیام آزمایشی آریا ERP*",
      ``,
      "اتصال به بازوی بله با موفقیت برقرار شد.",
      `زمان: ${new Date().toLocaleString("fa-IR")}`,
    ].join("\n");
  },
};

/**
 * Send notification if Bale is enabled and configured
 */
export async function sendBaleNotification(
  config: BaleConfig,
  text: string
): Promise<BaleSendResult> {
  if (!config.enabled) {
    return { ok: false, error: "اعلان بله غیرفعال است" };
  }
  if (!config.botToken || !config.chatId) {
    return { ok: false, error: "توکن یا Chat ID تنظیم نشده" };
  }
  return baleSendMessage(config.botToken, config.chatId, text);
}
