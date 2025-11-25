// pages/dashboard/index.js
import AdminLayout from '@/components/Layout/AdminLayout'

export default function DashboardIndex() {
  return (
    <div>
      <h3 className="mb-4">
        Welcome, Adminz!
      </h3>

      {/* Website Summary */}
      <section className="website-summary mb-4">
        <div className="row">
          <div className="col-md-4">
            <div
              className="card p-4 text-center"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #ddd',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
              }}
            >
              <i className="fas fa-box fa-3x mb-3" style={{ color: '#5a5a5a' }}></i>
              <h5>Total Pages</h5>
              <p className="h4">50</p>
            </div>
          </div>
          <div className="col-md-4">
            <div
              className="card p-4 text-center"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #ddd',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
              }}
            >
              <i className="fas fa-images fa-3x mb-3" style={{ color: '#5a5a5a' }}></i>
              <h5>Total Banner Albums</h5>
              <p className="h4">23</p>
            </div>
          </div>
          <div className="col-md-4">
            <div
              className="card p-4 text-center"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #ddd',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                borderRadius: '8px',
              }}
            >
              <i className="fas fa-newspaper fa-3x mb-3" style={{ color: '#5a5a5a' }}></i>
              <h5>Total News</h5>
              <p className="h4">6</p>
            </div>
          </div>
        </div>
      </section>

      {/* Website Stats and Info Section */}
      <section className="row mb-4">
        <div className="col-md-4">
          <h4>Website Summary</h4>
          <div className="list-group">
            <div className="list-group-item">
              <strong>Pages</strong>
              <p>41 Published Pages</p>
              <p>1 Private Page</p>
              <p>8 Deleted Pages</p>
            </div>
            <div className="list-group-item">
              <strong>Sub Banners</strong>
              <p>23 Albums</p>
              <p>0 Deleted Albums</p>
            </div>
            <div className="list-group-item">
              <strong>Users</strong>
              <p>2 Active Users</p>
              <p>0 Inactive Users</p>
            </div>
            <div className="list-group-item">
              <strong>News</strong>
              <p>5 Published News</p>
              <p>0 Private News</p>
              <p>1 Deleted News</p>
            </div>
          </div>
        </div>

        {/* Recent Activities Section */}
        <div className="col-md-8">
          <h4>My Recent Activities</h4>
          <ul className="list-group">
            <li
              className="list-group-item"
              style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #ddd',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '10px',
              }}
            >
              <strong>Adminz</strong> updated the settings copyright at 22 hours ago
            </li>
            <li
              className="list-group-item"
              style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #ddd',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '10px',
              }}
            >
              <strong>Adminz</strong> updated the page contents at Mar 14, 2025 3:15 PM
            </li>
            <li
              className="list-group-item"
              style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #ddd',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '10px',
              }}
            >
              <strong>Adminz</strong> deleted a page at Mar 14, 2025 3:12 PM
            </li>
            <li
              className="list-group-item"
              style={{
                backgroundColor: '#f8f9fa',
                border: '1px solid #ddd',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '10px',
              }}
            >
              <strong>Adminz</strong> updated the page contents at Mar 14, 2025 3:11 PM
            </li>
            {/* Add more activities here */}
          </ul>
        </div>
      </section>
    </div>
  );
}

DashboardIndex.Layout = AdminLayout;
