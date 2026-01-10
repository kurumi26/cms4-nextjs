import LandingPageLayout from "@/components/Layout/GuestLayout";
import { getPublicPageBySlug } from "@/services/publicPageService";

export default function ContactUsPage() {
  return (
    <div className="container py-5">
      {/* CONTACT DETAILS */}
      <div className="row mb-5">
        {/* MAP */}
        <div className="col-lg-7 mb-4">
          <iframe
            src="https://www.google.com/maps?q=Davao%20City%2C%20Philippines&t=&z=13&ie=UTF8&iwloc=&output=embed"
            width="100%"
            height="350"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>

        {/* DETAILS */}
        <div className="col-lg-5">
          <h5 className="fw-bold mb-3">Contact Details</h5>

          <p className="mb-2">
            <i className="fa fa-map-marker me-2 text-primary"></i>
            3rd Floor, ABC Building, J.P. Laurel Avenue,
            Bajada, Davao City, 8000 Philippines
          </p>

          <p className="mb-2">
            <i className="fa fa-phone me-2 text-primary"></i>
            (+63) 82 295-1234<br />
            (+63) 82 295-5678
          </p>

          <p className="mb-2">
            <i className="fa fa-envelope me-2 text-primary"></i>
            info@yourcompany.com
          </p>

          <p className="mb-2">
            <i className="fa fa-clock-o me-2 text-primary"></i>
            <strong>Monday – Friday:</strong> 8:00AM – 5:00PM
          </p>

          <p className="mt-3">
            <a href="#" className="text-primary fs-5">
              <i className="fa fa-facebook-square"></i>
            </a>
          </p>
        </div>
      </div>

      {/* CONTACT FORM */}
      <div className="row">
        <div className="col-lg-12">
          <h5 className="fw-bold mb-3">Leave Us a Message</h5>
          <p className="text-muted small">
            <strong>Note:</strong> Please do not leave required fields (*) empty.
          </p>

          <form>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">
                  Inquiry Type <span className="text-danger">*</span>
                </label>
                <select className="form-select">
                  <option value="">— Select One —</option>
                  <option>General Inquiry</option>
                  <option>Customer Support</option>
                  <option>Business Partnership</option>
                  <option>Careers</option>
                </select>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">
                  First Name <span className="text-danger">*</span>
                </label>
                <input type="text" className="form-control" />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">
                  Last Name <span className="text-danger">*</span>
                </label>
                <input type="text" className="form-control" />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">
                  E-mail Address <span className="text-danger">*</span>
                </label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="hello@email.com"
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="form-label">
                  Contact Number <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Landline or Mobile"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label">
                Message <span className="text-danger">*</span>
              </label>
              <textarea className="form-control" rows={5}></textarea>
            </div>

            <div className="d-flex gap-2">
              <button type="submit" className="btn btn-primary">
                Submit
              </button>
              <button type="reset" className="btn btn-outline-secondary">
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  const page = "contact-us";

  try {
    const res = await getPublicPageBySlug(page);
    return { props: { pageData: res.data } };
  } catch {
    return { notFound: true };
  }
}

ContactUsPage.Layout = LandingPageLayout;
