export default function WebsiteSummary() {
  return (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-primary text-white">
        <h4 className="mb-0">Website Summary</h4>
      </div>

      <div className="list-group list-group-flush">

        {/* Pages */}
        <div className="list-group-item py-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <strong className="fs-5">Pages</strong>
            <span className="badge bg-info">Total: 50</span>
          </div>

          <div className="d-flex justify-content-between mb-1">
            <span>Published</span>
            <span className="badge bg-success">41</span>
          </div>

          <div className="d-flex justify-content-between mb-1">
            <span>Private</span>
            <span className="badge bg-secondary">1</span>
          </div>

          <div className="d-flex justify-content-between">
            <span>Deleted</span>
            <span className="badge bg-danger">8</span>
          </div>
        </div>

        {/* Sub Banners */}
        <div className="list-group-item py-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <strong className="fs-5">Sub Banners</strong>
            <span className="badge bg-info">Total: 23</span>
          </div>

          <div className="d-flex justify-content-between mb-1">
            <span>Albums</span>
            <span className="badge bg-primary">23</span>
          </div>

          <div className="d-flex justify-content-between">
            <span>Deleted Albums</span>
            <span className="badge bg-secondary">0</span>
          </div>
        </div>

        {/* Users */}
        <div className="list-group-item py-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <strong className="fs-5">Users</strong>
            <span className="badge bg-info">Total: 2</span>
          </div>

          <div className="d-flex justify-content-between mb-1">
            <span>Active Users</span>
            <span className="badge bg-success">2</span>
          </div>

          <div className="d-flex justify-content-between">
            <span>Inactive Users</span>
            <span className="badge bg-secondary">0</span>
          </div>
        </div>

        {/* News */}
        <div className="list-group-item py-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <strong className="fs-5">News</strong>
            <span className="badge bg-info">Total: 6</span>
          </div>

          <div className="d-flex justify-content-between mb-1">
            <span>Published</span>
            <span className="badge bg-success">5</span>
          </div>

          <div className="d-flex justify-content-between mb-1">
            <span>Private</span>
            <span className="badge bg-secondary">0</span>
          </div>

          <div className="d-flex justify-content-between">
            <span>Deleted</span>
            <span className="badge bg-danger">1</span>
          </div>
        </div>

      </div>
    </div>
  );
}
