import type { JobDto } from "@linkatlas/contracts";

type JobActionProps = {
  readonly job: JobDto;
  readonly onCancel: (jobId: `job_${string}`) => Promise<void>;
  readonly onRetry: (jobId: `job_${string}`) => Promise<void>;
};

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
              <div className="job-main">
                <div className="job-title-row">
                  <strong>{jobTitle(job)}</strong>
                  <span className={`job-status ${job.status.toLowerCase()}`}>
                    {statusLabel(job.status)}
                  </span>
                </div>
                <span className="job-source">{job.sourceUrl ?? job.documentId ?? job.id}</span>
                <span>
                  {stageLabel(job.stage)} · {job.progress}% · {formatUpdatedAt(job.updatedAt)}
                </span>
                {job.errorCode === null ? null : <span>{job.errorCode}</span>}
              </div>
              <div className="job-progress">
                <progress aria-label={`진행률 ${job.progress}%`} value={job.progress} max={100} />
              </div>
              <JobActions job={job} onCancel={onCancel} onRetry={onRetry} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function JobActions(props: JobActionProps): React.JSX.Element {
  const { job, onCancel, onRetry } = props;

  switch (job.status) {
    case "QUEUED":
    case "RUNNING":
      return (
        <div className="job-actions">
          <button type="button" onClick={() => void onCancel(job.id)}>
            취소
          </button>
        </div>
      );
    case "FAILED":
      return (
        <div className="job-actions">
          <button type="button" onClick={() => void onRetry(job.id)}>
            재시도
          </button>
        </div>
      );
    case "BLOCKED":
      return <p className="job-terminal-note">처리 대기</p>;
    case "COMPLETED":
      return <p className="job-terminal-note">작업 완료</p>;
    case "CANCELLED":
      return <p className="job-terminal-note">취소됨</p>;
    default:
      return assertNever(job.status);
  }
}

function jobTitle(job: JobDto): string {
  if (job.sourceUrl === null) {
    return job.documentId ?? job.id;
  }

  try {
    const url = new URL(job.sourceUrl);
    const pathname = url.pathname === "/" ? "" : url.pathname;
    return `${url.hostname}${pathname}`;
  } catch {
    return job.sourceUrl;
  }
}

function statusLabel(status: JobDto["status"]): string {
  switch (status) {
    case "QUEUED":
      return "대기";
    case "RUNNING":
      return "실행 중";
    case "BLOCKED":
      return "보류";
    case "FAILED":
      return "실패";
    case "COMPLETED":
      return "완료";
    case "CANCELLED":
      return "취소됨";
    default:
      return assertNever(status);
  }
}

function stageLabel(stage: string | null): string {
  switch (stage) {
    case "stage_fetching":
      return "가져오기";
    case "stage_extracting":
      return "본문 추출";
    case "stage_summarizing":
      return "요약";
    case "stage_storing":
      return "저장";
    case null:
      return "단계 미상";
    default:
      return stage.replace(/^stage_/, "");
  }
}

function formatUpdatedAt(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function assertNever(value: never): never {
  throw new Error(`Unhandled job status: ${String(value)}`);
}
