"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import {
  Card, Badge, Button, Table, Td, Money, PageHeader, SearchBox, Modal,
  Input, Select, Tabs, Alert, formatDate, toPersianDigits,
} from "@/components/ui";
import {
  Plus, BookOpen, FileText, Wallet, Building,
  BarChart3, Download, CheckCircle,
} from "lucide-react";

/* ═══════════════ ACCOUNTS ═══════════════ */
export function AccountsModule() {
  const { accounts, addAccount } = useAppStore();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", type: "asset", level: "tafsili", parentId: "" });

  const filtered = accounts.filter(
    (a) => a.name.includes(search) || a.code.includes(search)
  );

  const levelLabel = (l: string) =>
    ({ kol: "کل", moein: "معین", tafsili: "تفصیلی", floating: "شناور" }[l] || l);
  const typeLabel = (t: string) =>
    ({ asset: "دارایی", liability: "بدهی", equity: "حقوق صاحبان سهام", revenue: "درآمد", expense: "هزینه" }[t] || t);
  const typeBadge = (t: string): "info" | "danger" | "purple" | "success" | "warning" =>
    ({ asset: "info", liability: "danger", equity: "purple", revenue: "success", expense: "warning" }[t] as "info" | "danger" | "purple" | "success" | "warning") || "default";

  const handleAdd = () => {
    addAccount({
      code: form.code,
      name: form.name,
      type: form.type as "asset",
      level: form.level as "tafsili",
      parentId: form.parentId || undefined,
      balance: 0,
      isActive: true,
    });
    setShowAdd(false);
    setForm({ code: "", name: "", type: "asset", level: "tafsili", parentId: "" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="دفتر حساب‌ها"
        subtitle="سیستم حسابداری چندسطحی — کل، معین، تفصیلی و شناور"
        actions={
          <Button onClick={() => setShowAdd(true)} size="sm">
            <Plus className="w-4 h-4" /> حساب جدید
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {["kol", "moein", "tafsili", "floating"].map((l) => (
          <Card key={l} className="!p-4">
            <p className="text-xs text-slate-500">سطح {levelLabel(l)}</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">
              {toPersianDigits(accounts.filter((a) => a.level === l).length)}
            </p>
          </Card>
        ))}
      </div>

      <Card>
        <div className="mb-4">
          <SearchBox value={search} onChange={setSearch} placeholder="جستجو بر اساس نام یا کد حساب..." />
        </div>
        <Table headers={["کد", "نام حساب", "نوع", "سطح", "مانده", "وضعیت"]}>
          {filtered.map((a) => (
            <tr key={a.id} className="hover:bg-slate-50 transition-colors">
              <Td className="font-mono font-medium text-[var(--color-primary)]">{a.code}</Td>
              <Td>
                <span style={{ paddingRight: a.level === "moein" ? 16 : a.level === "tafsili" ? 32 : 0 }}>
                  {a.level !== "kol" && <span className="text-slate-300 ml-1">└</span>}
                  {a.name}
                </span>
              </Td>
              <Td><Badge variant={typeBadge(a.type)}>{typeLabel(a.type)}</Badge></Td>
              <Td><Badge>{levelLabel(a.level)}</Badge></Td>
              <Td><Money amount={a.balance} /></Td>
              <Td>
                <Badge variant={a.isActive ? "success" : "default"}>
                  {a.isActive ? "فعال" : "غیرفعال"}
                </Badge>
              </Td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="تعریف حساب جدید" footer={
        <><Button variant="outline" onClick={() => setShowAdd(false)}>انصراف</Button>
        <Button onClick={handleAdd}>ثبت حساب</Button></>
      }>
        <div className="space-y-4">
          <Input label="کد حساب" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="مثلاً 1104" />
          <Input label="نام حساب" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="نام حساب" />
          <Select label="نوع حساب" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
            options={[
              { value: "asset", label: "دارایی" }, { value: "liability", label: "بدهی" },
              { value: "equity", label: "حقوق صاحبان سهام" }, { value: "revenue", label: "درآمد" },
              { value: "expense", label: "هزینه" },
            ]}
          />
          <Select label="سطح" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}
            options={[
              { value: "kol", label: "کل" }, { value: "moein", label: "معین" },
              { value: "tafsili", label: "تفصیلی" }, { value: "floating", label: "شناور" },
            ]}
          />
          <Select label="حساب والد" value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}
            options={[
              { value: "", label: "بدون والد" },
              ...accounts.filter((a) => a.level !== "tafsili" && a.level !== "floating").map((a) => ({
                value: a.id, label: `${a.code} - ${a.name}`,
              })),
            ]}
          />
        </div>
      </Modal>
    </div>
  );
}

/* ═══════════════ JOURNAL ENTRIES ═══════════════ */
export function JournalModule() {
  const { journalEntries, addJournalEntry, accounts, currentUser } = useAppStore();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({
    description: "",
    lines: [
      { accountId: "", debit: "", credit: "", description: "" },
      { accountId: "", debit: "", credit: "", description: "" },
    ],
  });

  const filtered = journalEntries.filter((j) => {
    const matchSearch = j.number.includes(search) || j.description.includes(search);
    const matchFilter = filter === "all" || j.status === filter || j.type === filter;
    return matchSearch && matchFilter;
  });

  const handleAdd = () => {
    const lines = form.lines
      .filter((l) => l.accountId && (l.debit || l.credit))
      .map((l, i) => {
        const acc = accounts.find((a) => a.id === l.accountId);
        return {
          id: `nl-${i}`,
          accountId: l.accountId,
          accountCode: acc?.code || "",
          accountName: acc?.name || "",
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          description: l.description,
        };
      });
    const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
    addJournalEntry({
      number: `1403-${String(journalEntries.length + 126).padStart(5, "0")}`,
      date: new Date().toISOString(),
      description: form.description,
      type: "manual",
      status: "posted",
      lines,
      createdBy: currentUser?.fullName || "کاربر",
      totalDebit,
      totalCredit,
    });
    setShowAdd(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="اسناد حسابداری"
        subtitle="ثبت دستی و خودکار اسناد — تولید خودکار برای فاکتورها، دریافت/پرداخت و انبار"
        actions={
          <Button onClick={() => setShowAdd(true)} size="sm">
            <Plus className="w-4 h-4" /> سند جدید
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px]">
          <SearchBox value={search} onChange={setSearch} placeholder="جستجوی سند..." />
        </div>
        <div className="flex gap-1">
          {[
            { id: "all", label: "همه" },
            { id: "posted", label: "ثبت‌شده" },
            { id: "draft", label: "پیش‌نویس" },
            { id: "auto", label: "اتوماتیک" },
            { id: "manual", label: "دستی" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                filter === f.id
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((je) => (
          <Card key={je.id} className="!p-0 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-slate-50/80 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="font-mono text-sm font-semibold text-[var(--color-primary)]">{je.number}</span>
                <Badge variant={je.type === "auto" ? "purple" : "info"}>
                  {je.type === "auto" ? "اتوماتیک" : "دستی"}
                </Badge>
                <Badge variant={je.status === "posted" ? "success" : je.status === "draft" ? "warning" : "danger"}>
                  {je.status === "posted" ? "ثبت‌شده" : je.status === "draft" ? "پیش‌نویس" : "باطل"}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <span>{formatDate(je.date)}</span>
                <span>{je.createdBy}</span>
              </div>
            </div>
            <div className="px-5 py-3">
              <p className="text-sm text-slate-700 mb-3">{je.description}</p>
              <Table headers={["کد حساب", "نام حساب", "بدهکار", "بستانکار", "شرح"]}>
                {je.lines.map((l) => (
                  <tr key={l.id}>
                    <Td className="font-mono text-xs">{l.accountCode}</Td>
                    <Td>{l.accountName}</Td>
                    <Td>{l.debit > 0 ? <Money amount={l.debit} /> : "—"}</Td>
                    <Td>{l.credit > 0 ? <Money amount={l.credit} /> : "—"}</Td>
                    <Td className="text-xs text-slate-400">{l.description || "—"}</Td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-semibold">
                  <Td colSpan={2}>جمع</Td>
                  <Td><Money amount={je.totalDebit} /></Td>
                  <Td><Money amount={je.totalCredit} /></Td>
                  <Td>
                    {je.totalDebit === je.totalCredit ? (
                      <Badge variant="success"><CheckCircle className="w-3 h-3 ml-1" />متوازن</Badge>
                    ) : (
                      <Badge variant="danger">نامتوازن</Badge>
                    )}
                  </Td>
                </tr>
              </Table>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="صدور سند حسابداری" size="xl" footer={
        <><Button variant="outline" onClick={() => setShowAdd(false)}>انصراف</Button>
        <Button onClick={handleAdd}>ثبت سند</Button></>
      }>
        <div className="space-y-4">
          <Input label="شرح سند" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          {form.lines.map((line, i) => (
            <div key={i} className="grid grid-cols-4 gap-3 p-3 bg-slate-50 rounded-lg">
              <Select
                label="حساب"
                value={line.accountId}
                onChange={(e) => {
                  const lines = [...form.lines];
                  lines[i] = { ...lines[i], accountId: e.target.value };
                  setForm({ ...form, lines });
                }}
                options={[
                  { value: "", label: "انتخاب حساب" },
                  ...accounts.filter((a) => a.level === "tafsili").map((a) => ({
                    value: a.id, label: `${a.code} - ${a.name}`,
                  })),
                ]}
              />
              <Input label="بدهکار" type="number" value={line.debit}
                onChange={(e) => {
                  const lines = [...form.lines];
                  lines[i] = { ...lines[i], debit: e.target.value, credit: "" };
                  setForm({ ...form, lines });
                }}
              />
              <Input label="بستانکار" type="number" value={line.credit}
                onChange={(e) => {
                  const lines = [...form.lines];
                  lines[i] = { ...lines[i], credit: e.target.value, debit: "" };
                  setForm({ ...form, lines });
                }}
              />
              <Input label="شرح ردیف" value={line.description}
                onChange={(e) => {
                  const lines = [...form.lines];
                  lines[i] = { ...lines[i], description: e.target.value };
                  setForm({ ...form, lines });
                }}
              />
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() =>
            setForm({ ...form, lines: [...form.lines, { accountId: "", debit: "", credit: "", description: "" }] })
          }>
            <Plus className="w-3 h-3" /> افزودن ردیف
          </Button>
        </div>
      </Modal>
    </div>
  );
}

/* ═══════════════ CHEQUES ═══════════════ */
export function ChequesModule() {
  const { cheques, addCheque, updateCheque } = useAppStore();
  const [tab, setTab] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    number: "", bank: "", amount: "", dueDate: "", type: "received", party: "", guarantor: "",
  });

  const filtered = cheques.filter((c) => {
    if (tab === "all") return true;
    if (tab === "received" || tab === "paid") return c.type === tab;
    return c.status === tab;
  });

  const statusLabel = (s: string) =>
    ({ pending: "در جریان", cleared: "پاس‌شده", bounced: "برگشتی", deposited: "خوابانده", guaranteed: "ضمانتی" }[s] || s);
  const statusBadge = (s: string): "warning" | "success" | "danger" | "info" | "purple" =>
    ({ pending: "warning", cleared: "success", bounced: "danger", deposited: "info", guaranteed: "purple" }[s] as "warning" | "success" | "danger" | "info" | "purple") || "default";

  const handleAdd = () => {
    addCheque({
      number: form.number,
      bank: form.bank,
      amount: Number(form.amount),
      dueDate: form.dueDate,
      issueDate: new Date().toISOString().split("T")[0],
      type: form.type as "received",
      status: "pending",
      party: form.party,
      guarantor: form.guarantor || undefined,
    });
    setShowAdd(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="مدیریت چک و اوراق بهادار"
        subtitle="ثبت چک‌های دریافتی، پرداختی، ضامنین، برگشتی، خواباندن و پاس شدن"
        actions={
          <Button onClick={() => setShowAdd(true)} size="sm">
            <Plus className="w-4 h-4" /> ثبت چک
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "در جریان", count: cheques.filter((c) => c.status === "pending").length, color: "warning" as const },
          { label: "پاس‌شده", count: cheques.filter((c) => c.status === "cleared").length, color: "success" as const },
          { label: "برگشتی", count: cheques.filter((c) => c.status === "bounced").length, color: "danger" as const },
          { label: "خوابانده", count: cheques.filter((c) => c.status === "deposited").length, color: "info" as const },
          { label: "کل مبلغ در جریان", count: cheques.filter((c) => c.status === "pending").reduce((s, c) => s + c.amount, 0), isMoney: true },
        ].map((s, i) => (
          <Card key={i} className="!p-4">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className="text-lg font-bold text-slate-800 mt-1">
              {s.isMoney ? <Money amount={s.count} /> : toPersianDigits(s.count)}
            </p>
          </Card>
        ))}
      </div>

      <Tabs
        tabs={[
          { id: "all", label: "همه", count: cheques.length },
          { id: "received", label: "دریافتی" },
          { id: "paid", label: "پرداختی" },
          { id: "pending", label: "در جریان" },
          { id: "bounced", label: "برگشتی" },
        ]}
        active={tab}
        onChange={setTab}
      />

      <Card noPadding>
        <Table headers={["شماره چک", "بانک", "مبلغ", "سررسید", "طرف حساب", "نوع", "وضعیت", "عملیات"]}>
          {filtered.map((c) => (
            <tr key={c.id} className="hover:bg-slate-50">
              <Td className="font-mono font-medium">{c.number}</Td>
              <Td>{c.bank}</Td>
              <Td><Money amount={c.amount} /></Td>
              <Td>{formatDate(c.dueDate)}</Td>
              <Td>
                {c.party}
                {c.guarantor && <span className="block text-[10px] text-slate-400">ضامن: {c.guarantor}</span>}
              </Td>
              <Td>
                <Badge variant={c.type === "received" ? "success" : "danger"}>
                  {c.type === "received" ? "دریافتی" : "پرداختی"}
                </Badge>
              </Td>
              <Td><Badge variant={statusBadge(c.status)}>{statusLabel(c.status)}</Badge></Td>
              <Td>
                <div className="flex gap-1">
                  {c.status === "pending" && (
                    <>
                      <Button size="sm" variant="success" onClick={() => updateCheque(c.id, { status: "cleared" })}>پاس</Button>
                      <Button size="sm" variant="outline" onClick={() => updateCheque(c.id, { status: "deposited" })}>خواباندن</Button>
                      <Button size="sm" variant="danger" onClick={() => updateCheque(c.id, { status: "bounced" })}>برگشت</Button>
                    </>
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="ثبت چک جدید" footer={
        <><Button variant="outline" onClick={() => setShowAdd(false)}>انصراف</Button>
        <Button onClick={handleAdd}>ثبت</Button></>
      }>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="شماره چک" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
            <Input label="بانک" value={form.bank} onChange={(e) => setForm({ ...form, bank: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="مبلغ (ریال)" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <Input label="تاریخ سررسید" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </div>
          <Select label="نوع" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
            options={[{ value: "received", label: "دریافتی" }, { value: "paid", label: "پرداختی" }]}
          />
          <Input label="طرف حساب" value={form.party} onChange={(e) => setForm({ ...form, party: e.target.value })} />
          <Input label="ضامن (اختیاری)" value={form.guarantor} onChange={(e) => setForm({ ...form, guarantor: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}

/* ═══════════════ PETTY CASH ═══════════════ */
export function PettyCashModule() {
  const { pettyCash } = useAppStore();

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="مدیریت تنخواه‌گردان" subtitle="ثبت هزینه‌های تنخواه‌داران و تسویه حساب‌های دوره‌ای" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pettyCash.map((pc) => (
          <Card key={pc.id}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{pc.holder}</p>
                  <p className="text-xs text-slate-400">{pc.period}</p>
                </div>
              </div>
              <Badge variant={pc.status === "open" ? "warning" : "success"}>
                {pc.status === "open" ? "باز" : "تسویه‌شده"}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-[10px] text-slate-400">مبلغ تنخواه</p>
                <Money amount={pc.amount} className="text-sm" />
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-[10px] text-slate-400">مانده</p>
                <Money amount={pc.remaining} className="text-sm text-emerald-600" />
              </div>
            </div>
            {pc.expenses.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-slate-500">هزینه‌ها:</p>
                {pc.expenses.map((e) => (
                  <div key={e.id} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-slate-700">{e.description}</p>
                      <p className="text-slate-400">{e.category} — {formatDate(e.date)}</p>
                    </div>
                    <Money amount={e.amount} className="text-red-600" />
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════ BANK RECONCILIATION ═══════════════ */
export function BankModule() {
  const { reconciliations } = useAppStore();

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="مغایرت‌گیری بانکی" subtitle="انطباق صورت‌حساب بانکی با تراکنش‌های ثبت‌شده" />

      {reconciliations.map((br) => (
        <Card key={br.id} title={br.bankAccount} subtitle={`دوره: ${br.period}`}>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-xs text-blue-600 mb-1">مانده صورت‌حساب بانکی</p>
              <Money amount={br.statementBalance} className="text-lg text-blue-800" />
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 text-center">
              <p className="text-xs text-emerald-600 mb-1">مانده دفاتر</p>
              <Money amount={br.bookBalance} className="text-lg text-emerald-800" />
            </div>
            <div className={`rounded-xl p-4 text-center ${br.difference === 0 ? "bg-emerald-50" : "bg-red-50"}`}>
              <p className={`text-xs mb-1 ${br.difference === 0 ? "text-emerald-600" : "text-red-600"}`}>مغایرت</p>
              <Money amount={br.difference} className={`text-lg ${br.difference === 0 ? "text-emerald-800" : "text-red-800"}`} />
            </div>
          </div>

          <Badge variant={br.status === "matched" ? "success" : br.status === "in_progress" ? "warning" : "danger"}>
            {br.status === "matched" ? "منطبق" : br.status === "in_progress" ? "در حال بررسی" : "نامنطبق"}
          </Badge>

          <div className="mt-4">
            <Table headers={["تاریخ", "شرح", "مبلغ", "منبع", "وضعیت"]}>
              {br.items.map((item) => (
                <tr key={item.id}>
                  <Td>{formatDate(item.date)}</Td>
                  <Td>{item.description}</Td>
                  <Td><Money amount={item.amount} /></Td>
                  <Td><Badge variant={item.type === "bank" ? "info" : "purple"}>{item.type === "bank" ? "بانک" : "دفاتر"}</Badge></Td>
                  <Td><Badge variant={item.matched ? "success" : "warning"}>{item.matched ? "منطبق" : "منتظر"}</Badge></Td>
                </tr>
              ))}
            </Table>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ═══════════════ TAX ═══════════════ */
export function TaxModule() {
  const { salesInvoices, purchaseInvoices, settings } = useAppStore();

  const totalSalesVat = salesInvoices.reduce((s, i) => s + i.vat, 0);
  const totalPurchaseVat = purchaseInvoices.reduce((s, i) => s + i.vat, 0);
  const netVat = totalSalesVat - totalPurchaseVat;
  const totalSales = salesInvoices.reduce((s, i) => s + i.subtotal, 0);
  const totalPurchases = purchaseInvoices.reduce((s, i) => s + i.subtotal, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="محاسبات مالیاتی و ارزش افزوده"
        subtitle={`نرخ VAT: ${toPersianDigits(settings.vatRate)}٪ — گزارشات فصلی ماده ۱۶۹ و اظهارنامه`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="!p-5">
          <p className="text-xs text-slate-500">VAT فروش (خروجی)</p>
          <Money amount={totalSalesVat} className="text-xl text-blue-700 mt-1 block" />
        </Card>
        <Card className="!p-5">
          <p className="text-xs text-slate-500">VAT خرید (ورودی)</p>
          <Money amount={totalPurchaseVat} className="text-xl text-emerald-700 mt-1 block" />
        </Card>
        <Card className="!p-5">
          <p className="text-xs text-slate-500">VAT خالص قابل پرداخت</p>
          <Money amount={netVat} className="text-xl text-red-700 mt-1 block" />
        </Card>
        <Card className="!p-5">
          <p className="text-xs text-slate-500">نرخ مالیات</p>
          <p className="text-xl font-bold text-slate-800 mt-1">{toPersianDigits(settings.vatRate)}٪</p>
        </Card>
      </div>

      <Alert variant="info">
        گزارش فصلی ماده ۱۶۹ برای دوره جاری آماده تولید است. مجموع معاملات فروش: <Money amount={totalSales} /> و خرید: <Money amount={totalPurchases} />
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card title="خلاصه VAT فروش" noPadding>
          <Table headers={["شماره فاکتور", "مشتری", "مبلغ", "VAT"]}>
            {salesInvoices.map((inv) => (
              <tr key={inv.id}>
                <Td className="font-mono text-xs">{inv.number}</Td>
                <Td>{inv.customerName}</Td>
                <Td><Money amount={inv.subtotal} /></Td>
                <Td><Money amount={inv.vat} /></Td>
              </tr>
            ))}
          </Table>
        </Card>
        <Card title="خلاصه VAT خرید" noPadding>
          <Table headers={["شماره", "تامین‌کننده", "مبلغ", "VAT"]}>
            {purchaseInvoices.map((inv) => (
              <tr key={inv.id}>
                <Td className="font-mono text-xs">{inv.number}</Td>
                <Td>{inv.supplierName}</Td>
                <Td><Money amount={inv.subtotal} /></Td>
                <Td><Money amount={inv.vat} /></Td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button variant="primary"><Download className="w-4 h-4" /> دانلود گزارش فصلی ماده ۱۶۹</Button>
        <Button variant="outline"><Download className="w-4 h-4" /> دانلود اظهارنامه VAT</Button>
      </div>
    </div>
  );
}

/* ═══════════════ FINANCIAL REPORTS ═══════════════ */
export function FinancialReportsModule() {
  const { accounts } = useAppStore();
  const [reportType, setReportType] = useState("balance");

  const assets = accounts.filter((a) => a.type === "asset" && a.level === "tafsili");
  const liabilities = accounts.filter((a) => a.type === "liability" && a.level === "tafsili");
  const equity = accounts.filter((a) => a.type === "equity" && a.level === "tafsili");
  const revenues = accounts.filter((a) => a.type === "revenue" && a.level === "tafsili");
  const expenses = accounts.filter((a) => a.type === "expense" && a.level === "tafsili");

  const totalAssets = assets.reduce((s, a) => s + a.balance, 0);
  const totalLiab = liabilities.reduce((s, a) => s + a.balance, 0);
  const totalEq = equity.reduce((s, a) => s + a.balance, 0);
  const totalRev = revenues.reduce((s, a) => s + a.balance, 0);
  const totalExp = expenses.reduce((s, a) => s + a.balance, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="گزارش‌های مالی استاندارد" subtitle="ترازنامه، سود و زیان، گردش وجه نقد، تراز آزمایشی" />

      <Tabs
        tabs={[
          { id: "balance", label: "ترازنامه", icon: <Building className="w-3.5 h-3.5" /> },
          { id: "income", label: "سود و زیان", icon: <BarChart3 className="w-3.5 h-3.5" /> },
          { id: "cashflow", label: "گردش وجه نقد", icon: <Wallet className="w-3.5 h-3.5" /> },
          { id: "trial", label: "تراز آزمایشی", icon: <BookOpen className="w-3.5 h-3.5" /> },
        ]}
        active={reportType}
        onChange={setReportType}
      />

      {reportType === "balance" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card title="دارایی‌ها" noPadding>
            <Table headers={["حساب", "مبلغ"]}>
              {assets.map((a) => (
                <tr key={a.id}><Td>{a.name}</Td><Td><Money amount={a.balance} /></Td></tr>
              ))}
              <tr className="bg-blue-50 font-bold"><Td>جمع دارایی‌ها</Td><Td><Money amount={totalAssets} /></Td></tr>
            </Table>
          </Card>
          <div className="space-y-4">
            <Card title="بدهی‌ها" noPadding>
              <Table headers={["حساب", "مبلغ"]}>
                {liabilities.map((a) => (
                  <tr key={a.id}><Td>{a.name}</Td><Td><Money amount={a.balance} /></Td></tr>
                ))}
                <tr className="bg-red-50 font-bold"><Td>جمع بدهی‌ها</Td><Td><Money amount={totalLiab} /></Td></tr>
              </Table>
            </Card>
            <Card title="حقوق صاحبان سهام" noPadding>
              <Table headers={["حساب", "مبلغ"]}>
                {equity.map((a) => (
                  <tr key={a.id}><Td>{a.name}</Td><Td><Money amount={a.balance} /></Td></tr>
                ))}
                <tr className="bg-purple-50 font-bold"><Td>جمع حقوق صاحبان سهام</Td><Td><Money amount={totalEq} /></Td></tr>
              </Table>
            </Card>
            <Card className="!p-4 bg-gradient-to-l from-blue-50 to-white">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-700">جمع بدهی + حقوق صاحبان سهام</span>
                <Money amount={totalLiab + totalEq} className="text-lg font-bold text-blue-700" />
              </div>
            </Card>
          </div>
        </div>
      )}

      {reportType === "income" && (
        <Card title="صورت سود و زیان" noPadding>
          <Table headers={["شرح", "مبلغ"]}>
            <tr className="bg-emerald-50"><Td className="font-semibold" colSpan={2}>درآمدها</Td></tr>
            {revenues.map((a) => (
              <tr key={a.id}><Td className="pr-8">{a.name}</Td><Td><Money amount={a.balance} /></Td></tr>
            ))}
            <tr className="font-bold bg-emerald-50/50"><Td>جمع درآمدها</Td><Td><Money amount={totalRev} /></Td></tr>
            <tr className="bg-red-50"><Td className="font-semibold" colSpan={2}>هزینه‌ها</Td></tr>
            {expenses.map((a) => (
              <tr key={a.id}><Td className="pr-8">{a.name}</Td><Td><Money amount={a.balance} /></Td></tr>
            ))}
            <tr className="font-bold bg-red-50/50"><Td>جمع هزینه‌ها</Td><Td><Money amount={totalExp} /></Td></tr>
            <tr className="font-bold bg-blue-50 text-base">
              <Td>سود (زیان) خالص</Td>
              <Td><Money amount={totalRev - totalExp} className={totalRev - totalExp >= 0 ? "text-emerald-700" : "text-red-700"} /></Td>
            </tr>
          </Table>
        </Card>
      )}

      {reportType === "cashflow" && (
        <Card title="صورت گردش وجه نقد">
          <div className="space-y-4">
            {[
              { title: "فعالیت‌های عملیاتی", items: [
                { name: "دریافت از مشتریان", amount: 2800000000 },
                { name: "پرداخت به تامین‌کنندگان", amount: -1800000000 },
                { name: "پرداخت حقوق", amount: -1500000000 },
                { name: "پرداخت مالیات", amount: -500000000 },
              ]},
              { title: "فعالیت‌های سرمایه‌گذاری", items: [
                { name: "خرید دارایی ثابت", amount: -420000000 },
                { name: "فروش دارایی", amount: 0 },
              ]},
              { title: "فعالیت‌های تأمین مالی", items: [
                { name: "تسهیلات بانکی", amount: 0 },
                { name: "بازپرداخت وام", amount: -200000000 },
              ]},
            ].map((section) => (
              <div key={section.title}>
                <h4 className="font-semibold text-sm text-slate-700 mb-2">{section.title}</h4>
                {section.items.map((item, i) => (
                  <div key={i} className="flex justify-between py-2 border-b border-slate-50 text-sm">
                    <span className="text-slate-600 pr-4">{item.name}</span>
                    <Money amount={item.amount} className={item.amount >= 0 ? "text-emerald-600" : "text-red-600"} />
                  </div>
                ))}
                <div className="flex justify-between py-2 font-semibold text-sm">
                  <span>خالص {section.title}</span>
                  <Money amount={section.items.reduce((s, i) => s + i.amount, 0)} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {reportType === "trial" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {["۲ ستونی", "۴ ستونی", "۶ ستونی"].map((t) => (
              <Badge key={t} variant="info">{t}</Badge>
            ))}
          </div>
          <Card title="تراز آزمایشی ۴ ستونی" noPadding>
            <Table headers={["کد", "نام حساب", "بدهکار", "بستانکار", "مانده بدهکار", "مانده بستانکار"]}>
              {accounts.filter((a) => a.level === "tafsili").map((a) => {
                const isDebit = ["asset", "expense"].includes(a.type);
                return (
                  <tr key={a.id}>
                    <Td className="font-mono text-xs">{a.code}</Td>
                    <Td>{a.name}</Td>
                    <Td>{isDebit ? <Money amount={a.balance} /> : "—"}</Td>
                    <Td>{!isDebit ? <Money amount={a.balance} /> : "—"}</Td>
                    <Td>{isDebit ? <Money amount={a.balance} /> : "—"}</Td>
                    <Td>{!isDebit ? <Money amount={a.balance} /> : "—"}</Td>
                  </tr>
                );
              })}
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
}
