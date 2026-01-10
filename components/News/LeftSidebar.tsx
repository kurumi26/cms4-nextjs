import { useState } from "react";

type Props = {
  categories: any[];
  archive: Record<string, { month: number; total: number }[]>;
};

const MONTHS = [
  "", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function LeftSidebar({ categories, archive }: Props) {
  const [search, setSearch] = useState("");
  const [openYears, setOpenYears] = useState<Record<string, boolean>>({});

  const toggleYear = (year: string) => {
    setOpenYears((prev) => ({
      ...prev,
      [year]: !prev[year],
    }));
  };

  return (
    <aside>
      {/* SEARCH */}
      <div className="mb-5">
        <h5 className="fw-bold text-primary mb-3">Search</h5>
        <div className="input-group">
          <input
            className="form-control"
            placeholder="Search news"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn btn-outline-primary">
            <i className="fa fa-search"></i>
          </button>
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="mb-5">
        <h5 className="fw-bold text-primary mb-3">Categories</h5>
        <ul className="list-unstyled">
          {categories.map((cat) => (
            <li key={cat.id} className="mb-2 d-flex">
              <a href={`/news?category=${cat.slug}`} className="text-decoration-none">
                {cat.name}
              </a>
              <span className="text-muted ms-2">({cat.articles_count})</span>
            </li>
          ))}
        </ul>
      </div>

      {/* ARCHIVE */}
      <div>
        <h5 className="fw-bold text-primary mb-3">News</h5>
        <ul className="list-unstyled">
          {Object.entries(archive).map(([year, months]) => (
            <li key={year} className="mb-2">
              <div
                className="fw-semibold cursor-pointer"
                onClick={() => toggleYear(year)}
                style={{ cursor: "pointer" }}
              >
                {openYears[year] ? "▾" : "▸"} {year}
              </div>

              {openYears[year] && (
                <ul className="list-unstyled ms-3 mt-2">
                  {months.map((m) => (
                    <li key={m.month} className="mb-1">
                      <a
                        href={`/news?year=${year}&month=${m.month}`}
                        className="text-decoration-none"
                      >
                        {MONTHS[m.month]} ({m.total})
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
