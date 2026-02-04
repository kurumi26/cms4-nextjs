import { useState } from "react";
import LandingPageLayout from "@/components/Layout/GuestLayout";
import JobModal from "@/components/careers/JobModal";
import { jobs, Job } from "@/data/jobs";

type Props = {
  jobs: Job[];
  currentPage: number;
  totalPages: number;
};

export default function CareersPage({ jobs, currentPage, totalPages }: Props) {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  return (
    <div className="container">
      <div className="p-t-80 p-b-80">

        {/* HEADER */}
        <div className="text-center p-b-60">
          <h3 className="txt33">Careers</h3>
          <p className="txt14 m-t-10">
            Explore open positions and grow your career with us
          </p>
        </div>

        {/* JOB LIST */}
        {jobs.map((job) => (
          <div key={job.id} className="blo4 bo5-b p-b-40 m-b-30">
            <h4 className="p-b-10">{job.title}</h4>

            <div className="txt32 flex-w p-b-10">
              <span>
                {job.department}
                <span className="m-r-6 m-l-4">|</span>
              </span>
              <span>
                {job.type}
                <span className="m-r-6 m-l-4">|</span>
              </span>
              <span>{job.location}</span>
            </div>

            <p className="m-b-20">{job.shortDescription}</p>

            <button
              className="btn3 flex-c-m size31 txt11 trans-0-4"
              onClick={() => setSelectedJob(job)}
            >
              View Job
            </button>
          </div>
        ))}

        {/* PAGINATION */}
        <div className="pagination flex-c-m p-t-30">
          {Array.from({ length: totalPages }).map((_, i) => {
            const page = i + 1;
            return (
              <a
                key={page}
                href={`/public/careers?page=${page}`}
                className={`item-pagination flex-c-m trans-0-4 ${
                  page === currentPage ? "active-pagination" : ""
                }`}
              >
                {page}
              </a>
            );
          })}
        </div>

        {/* MODAL */}
        {selectedJob && (
          <JobModal job={selectedJob} onClose={() => setSelectedJob(null)} />
        )}
      </div>
    </div>
  );
}

CareersPage.Layout = LandingPageLayout;

export async function getServerSideProps({ query }: any) {
  const PER_PAGE = 3;
  const page = Number(query.page) || 1;

  const start = (page - 1) * PER_PAGE;
  const end = start + PER_PAGE;

  const paginatedJobs = jobs.slice(start, end);
  const totalPages = Math.ceil(jobs.length / PER_PAGE);

  return {
    props: {
      jobs: paginatedJobs,
      currentPage: page,
      totalPages,
      pageData: {
        title: "Careers",
      },
    },
  };
}
