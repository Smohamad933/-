import { NextRequest, NextResponse } from "next/server";
import {
  buildMoadianInvoice,
  sendInvoiceToMoadian,
  inquiryByUid,
  getMoadianToken,
  type MoadianConfig,
  type SalesInvoiceLike,
} from "@/lib/moadian";

export const runtime = "nodejs";

/**
 * POST /api/moadian
 * actions: send | inquiry | test-token | preview
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    const config: MoadianConfig = {
      enabled: body.config?.enabled ?? true,
      mode: body.config?.mode === "production" ? "production" : "sandbox",
      fiscalId: (body.config?.fiscalId || "").trim(),
      economicCode: (body.config?.economicCode || "").trim(),
      privateKey: body.config?.privateKey || "",
      certificate: body.config?.certificate || "",
      clientId: body.config?.clientId || "",
    };

    if (action === "test-token") {
      if (!config.fiscalId || !config.privateKey) {
        return NextResponse.json({
          success: true,
          mode: "demo",
          message:
            "حالت دمو: برای تست واقعی، شناسه حافظه مالیاتی و کلید خصوصی RSA را وارد کنید.",
        });
      }
      const result = await getMoadianToken(config);
      if (result.token) {
        return NextResponse.json({
          success: true,
          message: "توکن با موفقیت دریافت شد",
          tokenPreview: result.token.slice(0, 20) + "…",
        });
      }
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    if (action === "preview" || action === "send") {
      const inv = body.invoice as SalesInvoiceLike;
      if (!inv?.number || !inv?.items?.length) {
        return NextResponse.json(
          { success: false, error: "اطلاعات فاکتور ناقص است" },
          { status: 400 }
        );
      }

      const vatRate = Number(body.vatRate ?? 10);
      const payload = buildMoadianInvoice(inv, {
        ...config,
        // Use placeholder fiscal for taxid generation in demo
        fiscalId: config.fiscalId || "A00000",
        economicCode: config.economicCode || "00000000000",
      }, vatRate, {
        ins: body.ins,
        irtaxid: body.irtaxid,
      });

      if (action === "preview") {
        return NextResponse.json({
          success: true,
          payload,
          taxid: payload.header.taxid,
          message: "پیش‌نمایش صورتحساب الکترونیکی (INVOICE.V01)",
        });
      }

      const result = await sendInvoiceToMoadian(payload, config);
      return NextResponse.json({
        ...result,
        payload,
      });
    }

    if (action === "inquiry") {
      const uids: string[] = body.uids || (body.uid ? [body.uid] : []);
      if (!uids.length) {
        return NextResponse.json(
          { success: false, error: "حداقل یک UID لازم است" },
          { status: 400 }
        );
      }
      const result = await inquiryByUid(uids, config);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { success: false, error: "action نامعتبر. مقادیر مجاز: send, preview, inquiry, test-token" },
      { status: 400 }
    );
  } catch (err) {
    console.error("[moadian API]", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "خطای داخلی سرور",
      },
      { status: 500 }
    );
  }
}
