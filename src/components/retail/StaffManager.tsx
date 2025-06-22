import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { auditService } from "@/services/auditService";

const PERMISSIONS = [
  { label: "POS Access", value: "canUsePOS", help: "Can use the Point of Sale system." },
  { label: "Inventory Management", value: "canManageInventory", help: "Can manage inventory and stock." },
  { label: "Full Access", value: "fullAccess", help: "Can access all features." },
];

export default function StaffManager() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "",
    email: "",
    permissions: ["canUsePOS"],
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    fetchStaff();
  }, []);

  async function fetchStaff() {
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, email, role, permissions, status")
      .eq("parent_id", user.id)
      .order("created_at", { ascending: false });
    if (!error) setStaff(data || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      // Invite user via Supabase Auth (send invite email)
      const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(form.email, {
        data: { name: form.name, parent_id: user.id, permissions: form.permissions },
      });
      if (inviteError || !inviteData?.user) throw new Error(inviteError?.message || "Failed to send invite");
      // Insert profile (if not already created by Supabase function)
      const { data, error } = await supabase
        .from("profiles")
        .upsert({
          id: inviteData.user.id,
          name: form.name,
          email: form.email,
          role: "worker",
          permissions: form.permissions,
          parent_id: user.id,
          status: "invited",
        });
      if (error) throw error;
      await auditService.logAction("INVITE_STAFF", "staff", data?.[0]?.id, { ...form });
      setSuccessMsg("Staff invited successfully. They will receive an email to set their password.");
      setForm({ name: "", email: "", permissions: ["canUsePOS"] });
      setEditingId(null);
      fetchStaff();
    } catch (err: any) {
      setErrorMsg(err.message || "Error inviting staff");
    } finally {
      setLoading(false);
    }
  }

  function handlePermissionChange(value: string) {
    setForm(f => {
      const perms = f.permissions.includes(value)
        ? f.permissions.filter(p => p !== value)
        : [...f.permissions, value];
      return { ...f, permissions: perms };
    });
  }

  async function handleEdit(staffMember: any) {
    setForm({
      name: staffMember.name,
      email: staffMember.email,
      permissions: staffMember.permissions || [],
    });
    setEditingId(staffMember.id);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to remove this staff member?")) return;
    await supabase.from("profiles").delete().eq("id", id);
    await auditService.logAction("REMOVE_STAFF", "staff", id);
    fetchStaff();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Staff (Invite & Permissions)</CardTitle>
      </CardHeader>
      <CardContent>
        {errorMsg && <div className="text-red-600 mb-2">{errorMsg}</div>}
        {successMsg && <div className="text-green-600 mb-2">{successMsg}</div>}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex gap-2 items-center">
            <Input
              placeholder="Name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
            />
            <Input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
            <Button type="submit" disabled={loading}>{editingId ? "Update" : "Invite"}</Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={() => { setEditingId(null); setForm({ name: "", email: "", permissions: ["canUsePOS"] }); }}>Cancel</Button>
            )}
          </div>
          <div className="flex gap-4 items-center">
            {PERMISSIONS.map(p => (
              <label key={p.value} className="flex items-center gap-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.permissions.includes(p.value)}
                  onChange={() => handlePermissionChange(p.value)}
                  className="accent-blue-600"
                />
                <span>{p.label}</span>
                <span className="text-xs text-gray-400 ml-1" title={p.help}>?</span>
              </label>
            ))}
          </div>
        </form>
        <div className="space-y-2">
          {staff.length === 0 ? <div>No staff found.</div> : staff.map(member => (
            <div key={member.id} className="flex items-center gap-4 border rounded p-2 bg-white">
              <div className="flex-1">
                <div className="font-semibold">{member.name} <span className="text-xs text-gray-500">({member.email})</span></div>
                <div className="text-xs text-gray-500">Permissions: {(member.permissions || []).join(", ")}</div>
                <div className="text-xs text-gray-400">Status: {member.status || "active"}</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleEdit(member)}>Edit</Button>
              <Button size="sm" variant="destructive" onClick={() => handleDelete(member.id)}>Remove</Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 