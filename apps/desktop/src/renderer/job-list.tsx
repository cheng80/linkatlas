import type { JobDto } from "@linkatlas/contracts";

export function JobList(props: {
  readonly jobs: readonly JobDto[];
  readonly onCancel: (jobId: `job_${string}`) => Promise<void>;
  readonly onRetry: (jobId: `job_${string}`) => Promise<void>;
}): React.JSX.Element {
  const { jobs, onCancel, onRetry } = props;
  return (
    <section className="jobs-panel" aria-label="Recent jobs">
      <div className="jobs-header">
        <p className="eyebrow">Jobs</p>
        <span>{jobs.length}</span>
      </div>
      {jobs.length === 0 ? (
        <p>최근 작업이 없습니다.</p>
      ) : (
        <ul>
          {jobs.map((job) => (
            <li key={job.id}>
              <div>
                <strong>{job.status}</strong>
                <span>{job.stage ?? "stage_unknown"}</span>
                {job.errorCode === null ? null : <span>{job.errorCode}</span>}
              </div>
              <progress value={job.progress} max={100} />
              <div className="job-actions">
                <button
                  type="button"
                  disabled={job.status !== "QUEUED" && job.status !== "RUNNING"}
                  onClick={() => void onCancel(job.id)}
                >
                  취소
                </button>
                <button
                  type="button"
                  disabled={job.status !== "FAILED"}
                  onClick={() => void onRetry(job.id)}
                >
                  재시도
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
