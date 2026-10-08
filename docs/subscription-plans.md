# Subscription plans and welcome trial

Student costs $3/month for independent learning and joining classes. Teacher costs $5/month and adds class creation and management. Existing 3- and 12-month periods retain their 10% and 20% discounts. There is no Individual plan or coin purchase/spend flow.

The `20261008090000_subscription_trials` migration gives existing accounts without active Premium seven fresh days from the migration time. Active legacy grants, permanent accounts, and paid subscriptions keep their access. Their welcome trial is recorded as already used, so removing paid access does not start a new trial.

Every signup path receives seven days through a PostgreSQL User insert trigger. FreeTrial uses the verified account email independently of a profile; login, profile changes, or deleting and recreating the same email cannot renew it. Expired trial records must be retained.

AI, IELTS and SAT require an active trial or paid access. Joining Classes requires paid access, even during the trial. Teacher and administrator membership requires Teacher or existing legacy Premium. Saved results/reviews and vocabulary remain available. API checks enforce provider access and class joins, including directly adding registered users.

Apply to the configured production database with `npm --prefix backend run prisma:deploy`, then deploy the backend and frontend together. The normal backend start command also runs pending migrations. Do not run the migration against a different database to grant live users access.

Existing payment callbacks and legacy subscriptions are honored. Old top-up orders cannot activate a subscription; support must handle those historical orders. Retired coin tables and the historical payment column remain in PostgreSQL as an archive, but are absent from the Prisma application model and all product flows.

Validation: `npm --prefix backend run test:billing` and `npm run test:billing-ui`.
