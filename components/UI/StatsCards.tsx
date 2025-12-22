interface StatsCardsProps {
  pagesCount: number;
  albumsCount: number;
  newsCount?: number; // optional for now
}

export default function StatsCards({
  pagesCount,
  albumsCount,
  newsCount = 0,
}: StatsCardsProps) {
  return (
    <section className="website-summary mb-4">
      <div className="row">
        {/* Pages */}
        <div className="col-md-4">
          <div
            className="card p-4 text-center"
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #ddd",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
              borderRadius: "8px",
            }}
          >
            <i className="fas fa-box fa-3x mb-3" style={{ color: "#5a5a5a" }} />
            <h5>Total Pages</h5>
            <p className="h4">{pagesCount}</p>
          </div>
        </div>

        {/* Albums */}
        <div className="col-md-4">
          <div
            className="card p-4 text-center"
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #ddd",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
              borderRadius: "8px",
            }}
          >
            <i className="fas fa-images fa-3x mb-3" style={{ color: "#5a5a5a" }} />
            <h5>Total Banner Albums</h5>
            <p className="h4">{albumsCount}</p>
          </div>
        </div>

        {/* News (future-ready) */}
        <div className="col-md-4">
          <div
            className="card p-4 text-center"
            style={{
              backgroundColor: "#ffffff",
              border: "1px solid #ddd",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
              borderRadius: "8px",
            }}
          >
            <i
              className="fas fa-newspaper fa-3x mb-3"
              style={{ color: "#5a5a5a" }}
            />
            <h5>Total News</h5>
            <p className="h4">{newsCount}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
