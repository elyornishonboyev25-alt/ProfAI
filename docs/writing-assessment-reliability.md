# Writing assessment operations

Writing submissions are stored in PostgreSQL before generation. `POST /api/v1/ai/generate/writing/submissions` accepts the existing taskType/prompt/response/visualContext contract and returns HTTP 202 with a submission ID, or 200 for a previously completed identical submission. Poll the authenticated `GET /api/v1/ai/generate/writing/submissions/:id` endpoint. IDs are account scoped and responses must not be cached.

A fingerprint of the rubric version and exact assessment input prevents duplicate paid requests after a lost POST response, two tabs or a reload. Both tasks in a full Writing test are submitted independently. Completed original assessments are checkpointed before the independent corrected-text pass. The frontend restores pending work from the existing saved test session.

The worker defaults to two concurrent assessments per process. `WRITING_WORKER_CONCURRENCY` accepts 1–16; increase it only after measuring latency and confirming provider capacity. Atomic database claims and five-minute leases protect work across replicas and recover jobs after an ungraceful process restart. Checkpoint/result writes require the current lease token. Successful completion clears the redundant checkpoint. Shutdown cancels generation and releases owned work for another worker. Browser cancellation only stops polling. A temporary database failure leaves the lease recoverable.

Jobs remain queued during transient outages, using exponential backoff and provider RetryInfo/Retry-After. Missing credentials, invalid model access or zero allocation use WAITING_CONFIGURATION and a five-minute retry interval. A deployment with new credentials immediately revisits configuration-blocked jobs. Pending jobs never receive guessed bands, default grades or zero scores presented as an AI result.

## Capacity and model configuration

Apply the `20261111060000_durable_writing_submissions` migration before deploying the frontend. The Railway backend's existing pre-deploy migration command applies it. Generation still requires working provider capacity: a zero free-tier allocation cannot be repaired by application retries. Gemini quotas are project-wide; extra keys from the same project do not create extra quota.

`GEMINI_API_KEY` and `GEMINI_ASSESSMENT_MODEL` configure the primary examiner. `GEMINI_ASSESSMENT_FALLBACK_MODELS` optionally lists explicitly selected additional Gemini assessment models. Independent paid fallback providers can be configured with `OPENAI_API_KEY` plus `OPENAI_ASSESSMENT_MODEL`, or `HF_ACCESS_TOKEN` plus `HF_ASSESSMENT_MODEL`. These dedicated model settings default to empty: ordinary chat defaults, including a small HF chat model, are not automatically used to grade essays. Audio assessment still only uses providers that accept the supplied audio.

All model results use the same server-owned IELTS rubric, evidence validation, correction reconstruction and blind corrected-text scoring. A provider change is recorded in the result metadata; it is not evidence of equivalent examiner accuracy. Model weights are not trained or fine-tuned by these prompt changes. Calibration against independently examiner-rated scripts is still required to quantify scoring accuracy.

No code path enables billing or purchases credits. Account owners must separately configure an API project with adequate capacity. A paid API can still have rate limits and outages; queue durability protects submitted work but cannot promise an always-instant result.

## Verification

Run backend build, `node --test backend/scripts/writing-assessment.test.mjs backend/scripts/writing-submission.test.mjs`, and the frontend runners for `writing-submission-ui.tsx`, `ielts-review-recovery-ui.tsx`, `ielts-review-improvements-ui.tsx`, `coach-studio.tsx` and `full-mock-flow-ui.tsx`. Test zero quota, a corrected-score outage, expired worker leases, account isolation and reload recovery. Real billing/model availability must be checked separately from fixture tests.

Primary references: [Google rate limits](https://ai.google.dev/gemini-api/docs/rate-limits), [Google retry guidance](https://ai.google.dev/gemini-api/docs/troubleshooting), [IELTS Writing descriptors](https://ielts.org/cdn/ielts-guides/ielts-writing-band-descriptors.pdf).
