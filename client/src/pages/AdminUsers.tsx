import { useEffect, useState } from "react";
import { ArrowLeft, Search, Users } from "lucide-react";
import { Link } from "wouter";
import AdminLayout from "@/components/AdminLayout";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      params.set("pageSize", "50");

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);

  const formatDate = (isoDate: string) => {
    if (!isoDate) return "—";
    return new Date(isoDate).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <AdminLayout>
      <div className="admin-topbar product-topbar">
        <div>
          <Link href="/admin" className="admin-back">
            <ArrowLeft size={15} /> Overview
          </Link>
          <p className="eyebrow">Customer records</p>
          <h1>Users</h1>
        </div>
        <div className="admin-user">
          <Users size={16} />
        </div>
      </div>

      <div className="sample-banner">
        Customer directory connected. Records reflect registered shoppers and
        storefront checkout profiles.
      </div>

      <div className="product-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            placeholder="Search users by name, email, or phone"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <section className="admin-table-panel">
        <div className="table-caption">
          <span>
            {total} customer record{total === 1 ? "" : "s"}
          </span>
          <span>Joined recently</span>
        </div>

        {loading ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "var(--muted)",
            }}
          >
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <p
              style={{ font: "600 20px var(--font-serif)", margin: "0 0 8px" }}
            >
              No customers found
            </p>
            <p style={{ color: "var(--secondary)", fontSize: "14px" }}>
              {search
                ? "No users matching your search query."
                : "No customer records have been created yet. When customers check out on the storefront, their details will appear here."}
            </p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Join date</th>
                <th>Orders / Carts</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, idx) => {
                const initial = u.name ? u.name.charAt(0).toUpperCase() : "U";
                const toneClass = `tone-0${(idx % 4) + 1}`;

                return (
                  <tr key={u.id}>
                    <td>
                      <div className="table-product">
                        <span className={`table-thumb ${toneClass}`}>
                          {initial}
                        </span>
                        <strong>{u.name}</strong>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>{u.phone || "—"}</td>
                    <td>{formatDate(u.joinedDate)}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: "var(--ink)" }}>
                        {u.ordersCount}
                      </span>{" "}
                      order{u.ordersCount === 1 ? "" : "s"} ·{" "}
                      <span style={{ color: "var(--muted)" }}>
                        {u.cartsCount} cart{u.cartsCount === 1 ? "" : "s"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </AdminLayout>
  );
}
