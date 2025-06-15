
import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Settings } from "lucide-react";
import { UserAccount } from "@/types/userAccount";
import UserProfileDrawer from "./UserProfileDrawer";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

interface Props {
  allUsers: UserAccount[];
  getRoleIcon: (role: string) => React.ReactNode;
  getStatusBadge: (status: string) => React.ReactNode;
}

const roles = [
  { label: "All", value: "" },
  { label: "Retail", value: "retail" },
  { label: "Wholesale", value: "wholesale" },
  { label: "Lab", value: "lab" },
  { label: "Individual", value: "individual" }
];

const statuses = [
  { label: "All", value: "" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" }
];

const AdminUsersTab: React.FC<Props> = ({
  allUsers,
  getRoleIcon,
  getStatusBadge,
}) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const filteredUsers = useMemo(() => {
    return allUsers.filter((user) => {
      const matchSearch = (user.name + user.email + (user.businessName || "")).toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter ? user.role === roleFilter : true;
      const matchStatus = statusFilter ? user.status === statusFilter : true;
      return matchSearch && matchRole && matchStatus;
    });
  }, [allUsers, search, roleFilter, statusFilter]);

  const openProfile = (user: UserAccount) => {
    setSelectedUser(user);
    setDrawerOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>All User Accounts</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          <Input
            placeholder="Search by name, email, business..."
            className="max-w-xs"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <Select
            value={roleFilter}
            onValueChange={setRoleFilter}
          >
            {roles.map(r =>
              <option value={r.value} key={r.value}>{r.label}</option>
            )}
          </Select>
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
          >
            {statuses.map(s =>
              <option value={s.value} key={s.value}>{s.label}</option>
            )}
          </Select>
        </div>
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <div key={user.id} className="flex flex-col md:flex-row md:justify-between md:items-center p-4 border rounded-lg">
              <div className="flex items-center gap-3 mb-2 md:mb-0">
                {getRoleIcon(user.role)}
                <div>
                  <h4 className="font-semibold">{user.businessName || user.name}</h4>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <Badge variant="outline" className="capitalize">{user.role}</Badge>
                    {getStatusBadge(user.status)}
                  </div>
                  {/* Add additional row details */}
                  <div className="text-xs text-gray-500 mt-1">
                    Registered: {user.registeredAt}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openProfile(user)}>
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                <Button size="sm" variant="outline">
                  <Settings className="h-4 w-4 mr-1" />
                  Manage
                </Button>
              </div>
            </div>
          ))}
        </div>
        <UserProfileDrawer user={selectedUser} open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      </CardContent>
    </Card>
  );
};

export default AdminUsersTab;
