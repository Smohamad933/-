"use client";

import { useState, useRef } from "react";
import { useAppStore } from "@/lib/store";
import type { User, UserTheme, Permission, UserRole } from "@/lib/types";
import {
  Card, Badge, Button, Table, Td, PageHeader, SearchBox, Modal,
  Input, Select, Alert, Toggle, formatDate, toPersianDigits,
} from "@/components/ui";
import {
  Plus, Type, Trash2, Edit, Download, Upload, Check,
} from "lucide-react";

const ALL_MODULES = [
  { id: "dashboard", label: "داشبورد" },
  { id: "accounting", label: "حسابداری" },
  { id: "inventory", label: "انبارداری" },
  { id: "assets", label: "دارایی‌ها" },
  { id: "sales", label: "فروش" },
  { id: "purchase", label: "خرید" },
  { id: "reports", label: "گزارش‌ها" },
  { id: "admin", label: "مدیریت" },
  { id: "settings", label: "تنظیمات" },
  { id: "customers", label: "مشتریان" },
  { id: "suppliers", label: "تامین‌کنندگان" },
];

const ROLE_LABELS: Record<string, string> = {
  admin: "مدیر سیستم", accountant: "حسابدار", warehouse: "انباردار",
  sales: "فروشنده", manager: "مدیر", viewer: "مشاهده‌گر",
};

const PRESET_COLORS = [
  "#1e40af", "#1d4ed8", "#2563eb", "#3b82f6",
  "#059669", "#10b981", "#0d9488", "#14b8a6",
  "#7c3aed", "#8b5cf6", "#a855f7", "#c026d3",
  "#dc2626", "#ef4444", "#e11d48", "#f43f5e",
  "#d97706", "#f59e0b", "#ca8a04", "#eab308",
  "#0f766e", "#0891b2", "#0284c7", "#0369a1",
  "#0f172a", "#1e293b", "#334155", "#475569",
];

/* ═══════════════ USERS ═══════════════ */
export function UsersModule() {
  const { users, addUser, updateUser, deleteUser } = useAppStore();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({
    username: "", fullName: "", email: "", role: "viewer", phone: "", department: "",
  });

  const filtered = users.filter(
    (u) => u.fullName.includes(search) || u.username.includes(search) || u.email.includes(search)
  );

  const handleAdd = () => {
    addUser({
      username: form.username,
      fullName: form.fullName,
      email: form.email,
      role: form.role as UserRole,
      phone: form.phone,
      department: form.department,
      active: true,
      permissions: [],
      theme: {
        primaryColor: "#1e40af", secondaryColor: "#0f172a", accentColor: "#06b6d4",
        fontFamily: "Vazirmatn", fontSize: "md", sidebarStyle: "dark",
        density: "comfortable", borderRadius: "md",
      },
    });
    setShowAdd(false);
    setForm({ username: "", fullName: "", email: "", role: "viewer", phone: "", department: "" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="مدیریت کاربران"
        subtitle="ایجاد، ویرایش و مدیریت کاربران سیستم"
        actions={<Button size="sm" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4" /> کاربر جدید</Button>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(ROLE_LABELS).map(([role, label]) => (
          <Card key={role} className="!p-4">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-2xl font-bold text-slate-800">
              {toPersianDigits(users.filter((u) => u.role === role).length)}
            </p>
          </Card>
        ))}
      </div>

      <SearchBox value={search} onChange={setSearch} placeholder="جستجوی کاربر..." />

      <Card noPadding>
        <Table headers={["کاربر", "نام کاربری", "نقش", "دپارتمان", "تلفن", "وضعیت", "آخرین ورود", "عملیات"]}>
          {filtered.map((u) => (
            <tr key={u.id} className="hover:bg-slate-50">
              <Td>
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: u.theme?.primaryColor || "#1e40af" }}
                  >
                    {u.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{u.fullName}</p>
                    <p className="text-[10px] text-slate-400">{u.email}</p>
                  </div>
                </div>
              </Td>
              <Td className="font-mono text-xs">{u.username}</Td>
              <Td><Badge variant={u.role === "admin" ? "danger" : u.role === "manager" ? "purple" : "info"}>{ROLE_LABELS[u.role]}</Badge></Td>
              <Td className="text-xs">{u.department || "—"}</Td>
              <Td className="text-xs" dir="ltr">{u.phone || "—"}</Td>
              <Td>
                <button onClick={() => updateUser(u.id, { active: !u.active })}>
                  <Badge variant={u.active ? "success" : "default"}>{u.active ? "فعال" : "غیرفعال"}</Badge>
                </button>
              </Td>
              <Td className="text-xs text-slate-400">{u.lastLogin ? formatDate(u.lastLogin) : "—"}</Td>
              <Td>
                <div className="flex gap-1">
                  <button onClick={() => setEditUser(u)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-600" title="ویرایش">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  {u.role !== "admin" && (
                    <button onClick={() => { if (confirm("آیا مطمئن هستید؟")) deleteUser(u.id); }} className="p-1.5 hover:bg-red-50 rounded-lg text-red-500" title="حذف">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      </Card>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="ایجاد کاربر جدید" footer={
        <><Button variant="outline" onClick={() => setShowAdd(false)}>انصراف</Button>
        <Button onClick={handleAdd}>ایجاد کاربر</Button></>
      }>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="نام کاربری" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            <Input label="نام کامل" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          </div>
          <Input label="ایمیل" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="نقش" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
              options={Object.entries(ROLE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
            />
            <Input label="دپارتمان" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </div>
          <Input label="تلفن" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
      </Modal>

      {editUser && (
        <Modal open={!!editUser} onClose={() => setEditUser(null)} title={`ویرایش: ${editUser.fullName}`} footer={
          <><Button variant="outline" onClick={() => setEditUser(null)}>انصراف</Button>
          <Button onClick={() => { updateUser(editUser.id, editUser); setEditUser(null); }}>ذخیره</Button></>
        }>
          <div className="space-y-4">
            <Input label="نام کامل" value={editUser.fullName} onChange={(e) => setEditUser({ ...editUser, fullName: e.target.value })} />
            <Input label="ایمیل" value={editUser.email} onChange={(e) => setEditUser({ ...editUser, email: e.target.value })} />
            <Select label="نقش" value={editUser.role} onChange={(e) => setEditUser({ ...editUser, role: e.target.value as UserRole })}
              options={Object.entries(ROLE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
            />
            <Input label="دپارتمان" value={editUser.department || ""} onChange={(e) => setEditUser({ ...editUser, department: e.target.value })} />
            <Input label="تلفن" value={editUser.phone || ""} onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })} />
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════════ PERMISSIONS (RBAC) ═══════════════ */
export function PermissionsModule() {
  const { users, updateUserPermissions } = useAppStore();
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id || "");
  const selectedUser = users.find((u) => u.id === selectedUserId);

  const togglePerm = (moduleId: string, field: keyof Omit<Permission, "module">) => {
    if (!selectedUser) return;
    const perms = selectedUser.permissions.map((p) =>
      p.module === moduleId ? { ...p, [field]: !p[field] } : p
    );
    // Ensure module exists
    if (!perms.find((p) => p.module === moduleId)) {
      perms.push({
        module: moduleId, view: false, create: false, edit: false, delete: false, approve: false,
        [field]: true,
      });
    }
    updateUserPermissions(selectedUserId, perms);
  };

  const setAllPerms = (value: boolean) => {
    if (!selectedUser) return;
    const perms = ALL_MODULES.map((m) => ({
      module: m.id, view: value, create: value, edit: value, delete: value, approve: value,
    }));
    updateUserPermissions(selectedUserId, perms);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="سطوح دسترسی (RBAC)"
        subtitle="تعیین دقیق دسترسی کاربران — مشاهده، ثبت، ویرایش، حذف و تأیید"
      />

      <div className="flex items-center gap-4">
        <Select
          label="انتخاب کاربر"
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          options={users.map((u) => ({ value: u.id, label: `${u.fullName} (${ROLE_LABELS[u.role]})` }))}
        />
        <div className="flex gap-2 mt-6">
          <Button size="sm" variant="outline" onClick={() => setAllPerms(true)}>اعطای همه</Button>
          <Button size="sm" variant="outline" onClick={() => setAllPerms(false)}>لغو همه</Button>
        </div>
      </div>

      {selectedUser && (
        <Card title={`دسترسی‌های ${selectedUser.fullName}`} subtitle={ROLE_LABELS[selectedUser.role]} noPadding>
          <Table headers={["ماژول", "مشاهده", "ثبت", "ویرایش", "حذف", "تأیید"]}>
            {ALL_MODULES.map((mod) => {
              const perm = selectedUser.permissions.find((p) => p.module === mod.id) || {
                module: mod.id, view: false, create: false, edit: false, delete: false, approve: false,
              };
              return (
                <tr key={mod.id} className="hover:bg-slate-50">
                  <Td className="font-medium">{mod.label}</Td>
                  {(["view", "create", "edit", "delete", "approve"] as const).map((field) => (
                    <Td key={field}>
                      <button
                        onClick={() => togglePerm(mod.id, field)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                          perm[field]
                            ? "bg-emerald-100 text-emerald-600 ring-1 ring-emerald-300"
                            : "bg-slate-100 text-slate-300 hover:bg-slate-200"
                        }`}
                      >
                        {perm[field] ? <Check className="w-4 h-4" /> : <span className="w-4 h-4" />}
                      </button>
                    </Td>
                  ))}
                </tr>
              );
            })}
          </Table>
        </Card>
      )}
    </div>
  );
}

/* ═══════════════ CUSTOMIZE PANEL ═══════════════ */
export function CustomizeModule() {
  const { users, updateUserTheme, settings, currentUser } = useAppStore();
  const [selectedUserId, setSelectedUserId] = useState(currentUser?.id || users[0]?.id || "");
  const selectedUser = users.find((u) => u.id === selectedUserId);
  const theme = selectedUser?.theme || settings.globalTheme;

  const update = (partial: Partial<UserTheme>) => {
    updateUserTheme(selectedUserId, partial);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="سفارشی‌سازی پنل کاربران"
        subtitle="شخصی‌سازی ظاهر پنل هر کاربر — رنگ، فونت، چگالی و سبک"
      />

      <Alert variant="info">
        می‌توانید ظاهر پنل هر کاربر را جداگانه تنظیم کنید. تغییرات بلافاصله اعمال می‌شوند.
      </Alert>

      <Select
        label="انتخاب کاربر برای سفارشی‌سازی"
        value={selectedUserId}
        onChange={(e) => setSelectedUserId(e.target.value)}
        options={users.map((u) => ({ value: u.id, label: `${u.fullName} (${ROLE_LABELS[u.role]})` }))}
      />

      {selectedUser && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Color Settings */}
          <Card title="رنگ‌بندی">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">رنگ اصلی (Primary)</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => update({ primaryColor: c })}
                      className={`w-8 h-8 rounded-lg transition-all ${
                        theme.primaryColor === c ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : "hover:scale-105"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.primaryColor}
                    onChange={(e) => update({ primaryColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
                  />
                  <Input
                    value={theme.primaryColor}
                    onChange={(e) => update({ primaryColor: e.target.value })}
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">رنگ تاکیدی (Accent)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.accentColor}
                    onChange={(e) => update({ accentColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
                  />
                  <Input
                    value={theme.accentColor}
                    onChange={(e) => update({ accentColor: e.target.value })}
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">رنگ ثانویه (Secondary)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={theme.secondaryColor}
                    onChange={(e) => update({ secondaryColor: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
                  />
                  <Input
                    value={theme.secondaryColor}
                    onChange={(e) => update({ secondaryColor: e.target.value })}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Layout Settings */}
          <Card title="چیدمان و ظاهر">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">سبک سایدبار</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: "dark", label: "تیره", bg: "bg-slate-900" },
                    { id: "light", label: "روشن", bg: "bg-white border" },
                    { id: "colored", label: "رنگی", bg: "" },
                  ] as const).map((s) => (
                    <button
                      key={s.id}
                      onClick={() => update({ sidebarStyle: s.id })}
                      className={`p-3 rounded-xl text-center text-xs font-medium transition-all ${
                        theme.sidebarStyle === s.id
                          ? "ring-2 ring-[var(--color-primary)] ring-offset-1"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div
                        className={`w-full h-8 rounded-lg mb-2 ${s.bg}`}
                        style={s.id === "colored" ? { backgroundColor: theme.primaryColor } : {}}
                      />
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">چگالی نمایش</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: "compact", label: "فشرده" },
                    { id: "comfortable", label: "راحت" },
                    { id: "spacious", label: "باز" },
                  ] as const).map((d) => (
                    <button
                      key={d.id}
                      onClick={() => update({ density: d.id })}
                      className={`px-3 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                        theme.density === d.id
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">گردی گوشه‌ها</label>
                <div className="grid grid-cols-4 gap-2">
                  {([
                    { id: "none", label: "تیز", r: "rounded-none" },
                    { id: "sm", label: "کم", r: "rounded" },
                    { id: "md", label: "متوسط", r: "rounded-lg" },
                    { id: "lg", label: "زیاد", r: "rounded-2xl" },
                  ] as const).map((b) => (
                    <button
                      key={b.id}
                      onClick={() => update({ borderRadius: b.id })}
                      className={`px-3 py-2.5 text-xs font-medium border transition-all ${b.r} ${
                        theme.borderRadius === b.id
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">اندازه فونت</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { id: "sm", label: "کوچک", size: "text-xs" },
                    { id: "md", label: "متوسط", size: "text-sm" },
                    { id: "lg", label: "بزرگ", size: "text-base" },
                  ] as const).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => update({ fontSize: f.id })}
                      className={`px-3 py-2.5 rounded-xl font-medium border transition-all ${f.size} ${
                        theme.fontSize === f.id
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Font Selection */}
          <Card title="فونت">
            <div className="space-y-2">
              {settings.availableFonts.map((font) => (
                <button
                  key={font.id}
                  onClick={() => update({ fontFamily: font.family })}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all text-right ${
                    theme.fontFamily === font.family
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 ring-1 ring-[var(--color-primary)]/20"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                  style={{ fontFamily: font.family }}
                >
                  <div>
                    <p className="font-medium text-slate-800">{font.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5" style={{ fontFamily: font.family }}>
                      نمونه متن فارسی با فونت {font.name} — ۱۲۳۴۵۶۷۸۹۰
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {font.isCustom && <Badge variant="purple">سفارشی</Badge>}
                    {theme.fontFamily === font.family && (
                      <div className="w-6 h-6 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </Card>

          {/* Live Preview */}
          <Card title="پیش‌نمایش زنده">
            <div
              className="rounded-xl overflow-hidden border border-slate-200 shadow-sm"
              style={{
                fontFamily: theme.fontFamily,
                fontSize: theme.fontSize === "sm" ? "12px" : theme.fontSize === "lg" ? "16px" : "14px",
              }}
            >
              {/* Mini sidebar */}
              <div className="flex h-48">
                <div
                  className="w-20 flex flex-col items-center py-3 gap-2"
                  style={{
                    backgroundColor:
                      theme.sidebarStyle === "dark" ? "#0f172a" :
                      theme.sidebarStyle === "colored" ? theme.primaryColor : "#ffffff",
                    color: theme.sidebarStyle === "light" ? "#334155" : "#ffffff",
                    borderLeft: theme.sidebarStyle === "light" ? "1px solid #e2e8f0" : "none",
                  }}
                >
                  <div className="w-6 h-6 rounded-md bg-white/20" />
                  <div className="w-6 h-1.5 rounded bg-white/30" />
                  <div className="w-6 h-1.5 rounded bg-white/20" />
                  <div className="w-6 h-1.5 rounded bg-white/20" />
                  <div
                    className="w-6 h-1.5 rounded mt-auto"
                    style={{ backgroundColor: theme.accentColor, opacity: 0.6 }}
                  />
                </div>
                <div className="flex-1 bg-slate-50 p-3">
                  <div
                    className="h-6 rounded mb-2"
                    style={{
                      backgroundColor: theme.primaryColor,
                      borderRadius: theme.borderRadius === "none" ? 0 : theme.borderRadius === "sm" ? 4 : theme.borderRadius === "lg" ? 12 : 8,
                      opacity: 0.9,
                    }}
                  />
                  <div className="grid grid-cols-2 gap-1.5">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="bg-white p-2 shadow-sm"
                        style={{
                          borderRadius: theme.borderRadius === "none" ? 0 : theme.borderRadius === "sm" ? 4 : theme.borderRadius === "lg" ? 12 : 8,
                        }}
                      >
                        <div className="h-1.5 w-8 rounded bg-slate-200 mb-1" />
                        <div className="h-2.5 w-12 rounded" style={{ backgroundColor: theme.primaryColor, opacity: 0.3 }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3 text-center">
              پیش‌نمایش تم {selectedUser.fullName}
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ═══════════════ FONTS MANAGEMENT ═══════════════ */
export function FontsModule() {
  const { settings, addFont, removeFont, updateUserTheme, currentUser, users } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", family: "", url: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAddFont = () => {
    if (!form.name || !form.family) return;
    addFont({
      id: `f-custom-${Date.now()}`,
      name: form.name,
      family: form.family,
      url: form.url || undefined,
      isCustom: true,
      weights: [400, 700],
    });
    // Inject font face if URL provided
    if (form.url) {
      const style = document.createElement("style");
      style.textContent = `
        @font-face {
          font-family: '${form.family}';
          src: url('${form.url}');
          font-weight: 100 900;
          font-display: swap;
        }
      `;
      document.head.appendChild(style);
    }
    setShowAdd(false);
    setForm({ name: "", family: "", url: "" });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const familyName = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, "");
    addFont({
      id: `f-upload-${Date.now()}`,
      name: file.name.replace(/\.[^.]+$/, ""),
      family: familyName || `CustomFont${Date.now()}`,
      url,
      isCustom: true,
      weights: [400],
    });
    const style = document.createElement("style");
    style.textContent = `
      @font-face {
        font-family: '${familyName}';
        src: url('${url}');
        font-weight: 100 900;
        font-display: swap;
      }
    `;
    document.head.appendChild(style);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="مدیریت فونت‌ها"
        subtitle="افزودن فونت دلخواه از URL یا آپلود فایل — اعمال روی پنل هر کاربر"
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="w-4 h-4" /> آپلود فونت
            </Button>
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4" /> افزودن از URL
            </Button>
            <input ref={fileRef} type="file" accept=".ttf,.otf,.woff,.woff2" className="hidden" onChange={handleFileUpload} />
          </div>
        }
      />

      <Alert variant="info">
        فونت‌های پشتیبانی‌شده: TTF, OTF, WOFF, WOFF2. پس از افزودن، از بخش «سفارشی‌سازی پنل» فونت را به کاربر اختصاص دهید.
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settings.availableFonts.map((font) => {
          const usedBy = users.filter((u) => u.theme?.fontFamily === font.family);
          return (
            <Card key={font.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <Type className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{font.name}</h3>
                    <p className="text-xs text-slate-400 font-mono">{font.family}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {font.isCustom ? (
                    <Badge variant="purple">سفارشی</Badge>
                  ) : (
                    <Badge variant="info">سیستمی</Badge>
                  )}
                  {font.isCustom && (
                    <button
                      onClick={() => removeFont(font.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Font preview */}
              <div
                className="bg-slate-50 rounded-xl p-4 mb-3 space-y-2"
                style={{ fontFamily: font.family }}
              >
                <p className="text-lg text-slate-800">سلام! این یک نمونه متن فارسی است.</p>
                <p className="text-sm text-slate-600">The quick brown fox jumps over the lazy dog.</p>
                <p className="text-sm text-slate-500" dir="ltr">0123456789 — ۱۲۳۴۵۶۷۸۹۰</p>
                <p className="text-xs text-slate-400">حسابداری مالی · انبارداری · دارایی ثابت · فروش و خرید</p>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>وزن‌ها: {font.weights.map((w) => toPersianDigits(w)).join("، ")}</span>
                <span>{toPersianDigits(usedBy.length)} کاربر</span>
              </div>

              {usedBy.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {usedBy.map((u) => (
                    <div
                      key={u.id}
                      className="w-6 h-6 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
                      style={{ backgroundColor: u.theme?.primaryColor || "#1e40af" }}
                      title={u.fullName}
                    >
                      {u.fullName.charAt(0)}
                    </div>
                  ))}
                </div>
              )}

              {currentUser && (
                <Button
                  size="sm"
                  variant={currentUser.theme?.fontFamily === font.family ? "primary" : "outline"}
                  className="w-full mt-3"
                  onClick={() => updateUserTheme(currentUser.id, { fontFamily: font.family })}
                >
                  {currentUser.theme?.fontFamily === font.family ? (
                    <><Check className="w-3.5 h-3.5" /> فونت فعلی شما</>
                  ) : (
                    "اعمال روی پنل من"
                  )}
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="افزودن فونت از URL" footer={
        <><Button variant="outline" onClick={() => setShowAdd(false)}>انصراف</Button>
        <Button onClick={handleAddFont}>افزودن فونت</Button></>
      }>
        <div className="space-y-4">
          <Input
            label="نام نمایشی فونت"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="مثلاً ایران یکان"
          />
          <Input
            label="نام CSS Family"
            value={form.family}
            onChange={(e) => setForm({ ...form, family: e.target.value })}
            placeholder="مثلاً IRANYekan"
          />
          <Input
            label="آدرس فایل فونت (URL)"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="https://example.com/fonts/myfont.woff2"
          />
          <Alert variant="info">
            می‌توانید از CDNهایی مثل Google Fonts یا فونت‌های ایرانی میزبانی‌شده استفاده کنید.
            مثال: https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/webfonts/Vazirmatn-Regular.woff2
          </Alert>
        </div>
      </Modal>
    </div>
  );
}

/* ═══════════════ AUDIT LOG ═══════════════ */
export function AuditModule() {
  const { auditLogs } = useAppStore();
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");

  const filtered = auditLogs.filter((l) => {
    const matchSearch = l.userName.includes(search) || l.action.includes(search) || l.details.includes(search);
    const matchModule = moduleFilter === "all" || l.module === moduleFilter;
    return matchSearch && matchModule;
  });

  const modules = Array.from(new Set(auditLogs.map((l) => l.module)));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="لاگ حسابرسی (Audit Trail)"
        subtitle="ثبت تمامی فعالیت‌های کاربران — چه کسی، چه زمانی، چه تغییری"
      />

      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px]">
          <SearchBox value={search} onChange={setSearch} placeholder="جستجو در لاگ‌ها..." />
        </div>
        <Select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          options={[
            { value: "all", label: "همه ماژول‌ها" },
            ...modules.map((m) => ({ value: m, label: m })),
          ]}
        />
      </div>

      <Card noPadding>
        <Table headers={["زمان", "کاربر", "عملیات", "ماژول", "جزئیات", "شناسه"]}>
          {filtered.map((log) => (
            <tr key={log.id} className="hover:bg-slate-50">
              <Td className="text-xs text-slate-500">
                {new Date(log.timestamp).toLocaleString("fa-IR")}
              </Td>
              <Td className="font-medium text-sm">{log.userName}</Td>
              <Td><Badge variant="info">{log.action}</Badge></Td>
              <Td><Badge>{log.module}</Badge></Td>
              <Td className="text-xs text-slate-600 max-w-[200px] truncate">{log.details}</Td>
              <Td className="font-mono text-[10px] text-slate-400">{log.entityId || "—"}</Td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
}

/* ═══════════════ BACKUP ═══════════════ */
export function BackupModule() {
  const { settings, updateSettings } = useAppStore();
  const [backing, setBacking] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const handleBackup = () => {
    setBacking(true);
    setTimeout(() => {
      // Export data as JSON
      const data = localStorage.getItem("erp-aria-storage");
      if (data) {
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `aria-erp-backup-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
      setLastBackup(new Date().toISOString());
      setMessage("پشتیبان‌گیری با موفقیت انجام شد و فایل دانلود گردید.");
      setBacking(false);
    }, 1500);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = ev.target?.result as string;
        JSON.parse(data); // validate
        localStorage.setItem("erp-aria-storage", data);
        setMessage("بازیابی با موفقیت انجام شد. صفحه را رفرش کنید.");
        setTimeout(() => window.location.reload(), 2000);
      } catch {
        setMessage("فایل پشتیبان نامعتبر است.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="پشتیبان‌گیری"
        subtitle="بک‌آپ‌گیری خودکار و دستی از دیتابیس با قابلیت بازیابی امن"
      />

      {message && <Alert variant="success">{message}</Alert>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="پشتیبان‌گیری دستی">
          <p className="text-sm text-slate-500 mb-4">
            یک نسخه کامل از تمام داده‌های سیستم (حساب‌ها، فاکتورها، کالاها، کاربران و تنظیمات) را دانلود کنید.
          </p>
          <Button onClick={handleBackup} loading={backing} className="w-full">
            <Download className="w-4 h-4" />
            {backing ? "در حال تهیه پشتیبان..." : "دانلود پشتیبان"}
          </Button>
          {lastBackup && (
            <p className="text-xs text-slate-400 mt-2 text-center">
              آخرین پشتیبان: {new Date(lastBackup).toLocaleString("fa-IR")}
            </p>
          )}
        </Card>

        <Card title="بازیابی از پشتیبان">
          <p className="text-sm text-slate-500 mb-4">
            فایل پشتیبان JSON را انتخاب کنید تا داده‌ها بازیابی شوند. توجه: داده‌های فعلی جایگزین خواهند شد.
          </p>
          <label className="w-full">
            <div className="flex items-center justify-center gap-2 w-full px-4 py-2 border-2 border-dashed border-slate-300 rounded-xl text-sm text-slate-600 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              انتخاب فایل پشتیبان
            </div>
            <input type="file" accept=".json" className="hidden" onChange={handleRestore} />
          </label>
        </Card>
      </div>

      <Card title="تنظیمات پشتیبان‌گیری خودکار">
        <div className="space-y-4">
          <Toggle
            checked={settings.autoBackup}
            onChange={(v) => updateSettings({ autoBackup: v })}
            label="فعال‌سازی پشتیبان‌گیری خودکار"
          />
          <Select
            label="بازه زمانی"
            value={settings.backupInterval}
            onChange={(e) => updateSettings({ backupInterval: e.target.value as "daily" })}
            options={[
              { value: "daily", label: "روزانه" },
              { value: "weekly", label: "هفتگی" },
              { value: "monthly", label: "ماهانه" },
            ]}
          />
        </div>
      </Card>
    </div>
  );
}
