import { useEffect, useState } from "react";
import AdminLayout from "@/components/Layout/AdminLayout";
import DataTable, { Column } from "@/components/UI/DataTable";
import SearchBar from "@/components/UI/SearchBar";
import PageSizeSelector from "@/components/UI/PageSizeSelector";
import { getMenus, MenuRow, activateMenu } from "@/services/menuService";
import { useRouter } from "next/router";
import { toast } from "@/lib/toast";

function ManageMenus() {
  const router = useRouter();

  const [menus, setMenus] = useState<MenuRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage, setPerPage] = useState(10);

  /* ======================
   * Fetch Menus
   * ====================== */
  const fetchMenus = async () => {
    try {
      setLoading(true);

      const res = await getMenus({
        search,
        page: currentPage,
        per_page: perPage,
      });

      setMenus(res.data.data);
      setTotalPages(res.data.last_page); // ✅ FIXED
    } catch (err) {
      console.error("Failed to load menus", err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (id: number) => {
    try {
      await activateMenu(id);
      fetchMenus(); // refresh list
    } catch (err) {
      console.error("Failed to activate menu", err);
      toast.error("Failed to activate menu");
    }
  };

  /* ======================
   * Effects
   * ====================== */
  useEffect(() => {
    const timeout = setTimeout(fetchMenus, 400);
    return () => clearTimeout(timeout);
  }, [search, currentPage, perPage]);

  /* ======================
   * Columns
   * ====================== */
  const columns: Column<MenuRow>[] = [
    {
      key: "select",
      header: <input type="checkbox" />,
      render: () => <input type="checkbox" />,
    },
    {
      key: "name",
      header: "Menu Name",
      render: (row) => (
        <span className="fw-bold text-primary">{row.name}</span>
      ),
    },
    {
      key: "is_active",
      header: "Menu Status",
      render: (row) => (
        <span
          className={`badge ${
            row.is_active ? "bg-success" : "bg-secondary"
          }`}
        >
          {row.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "updated_at_formatted",
      header: "Date Modified",
    },
    {
      key: "options",
      header: "Options",
      render: (row) => (
        <>
          {/* Edit */}
          <button
            className="btn btn-link p-0 me-2 text-secondary"
            title="Edit"
            onClick={() => router.push(`/menu/edit/${row.id}`)}
          >
            <i className="fas fa-edit" />
          </button>

          {/* Set Active */}
          <button
            className="btn btn-link p-0"
            title={
              row.is_active
                ? "This menu is currently active"
                : "Set as active menu"
            }
            onClick={() => handleActivate(row.id)}
            style={{
              color: row.is_active ? "#198754" : "#6c757d",
              opacity: row.is_active ? 0.5 : 1,
            }}
          >
            <i
              className={`fas ${
                row.is_active ? "fa-toggle-on" : "fa-toggle-off"
              }`}
            />
          </button>
        </>
      ),
    },
  ];
  
  return (
    <div className="container">
      <h3 className="mb-3">Manage Menus</h3>

      <SearchBar
        placeholder="Search Menus"
        value={search}
        onChange={(value) => {
          setSearch(value);
          setCurrentPage(1);
        }}
      />

      <PageSizeSelector
        value={perPage}
        onChange={(value) => {
          setPerPage(value);
          setCurrentPage(1);
        }}
      />

      <DataTable<MenuRow>
        columns={columns}
        data={menus}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

ManageMenus.Layout = AdminLayout;
export default ManageMenus;
