import { NextRequest, NextResponse } from "next/server";
import {
  baleGetMe,
  baleSendMessage,
  baleGetUpdates,
  BaleMessages,
} from "@/lib/bale";

export const runtime = "nodejs";

/**
 * POST /api/bale
 * actions: test-token | send | get-chats | test-message
 *
 * Bale Bot API: https://docs.bale.ai/
 * Base URL: https://tapi.bale.ai/bot{token}/{METHOD}
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;
    const token = (body.botToken || body.token || "").trim();
    const chatId = body.chatId ?? body.chat_id;

    if (action === "test-token") {
      if (!token) {
        return NextResponse.json(
          { ok: false, error: "توکن بازو الزامی است" },
          { status: 400 }
        );
      }
      const result = await baleGetMe(token);
      return NextResponse.json(result, { status: result.ok ? 200 : 400 });
    }

    if (action === "get-chats") {
      if (!token) {
        return NextResponse.json(
          { ok: false, error: "توکن بازو الزامی است" },
          { status: 400 }
        );
      }
      const result = await baleGetUpdates(token);
      return NextResponse.json(result, { status: result.ok ? 200 : 400 });
    }

    if (action === "test-message" || action === "send") {
      if (!token) {
        return NextResponse.json(
          { ok: false, error: "توکن بازو الزامی است" },
          { status: 400 }
        );
      }
      if (chatId === undefined || chatId === null || chatId === "") {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Chat ID الزامی است. ابتدا به بازو پیام دهید و از «دریافت Chat ID» استفاده کنید.",
          },
          { status: 400 }
        );
      }

      const text =
        action === "test-message"
          ? BaleMessages.testMessage()
          : body.text || BaleMessages.testMessage();

      const result = await baleSendMessage(token, chatId, text);
      return NextResponse.json(result, { status: result.ok ? 200 : 400 });
    }

    return NextResponse.json(
      {
        ok: false,
        error: "action نامعتبر. مقادیر: test-token, get-chats, test-message, send",
      },
      { status: 400 }
    );
  } catch (err) {
    console.error("[bale API]", err);
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "خطای داخلی سرور",
      },
      { status: 500 }
    );
  }
}
