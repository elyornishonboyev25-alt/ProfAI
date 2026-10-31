# Firdavss7 promo

`Firdavss7` grants three calendar months of PRO once per account. Code matching is case insensitive. It is a campaign code, so it has no referral age limit and does not require Telegram membership.

The reward follows all existing subscription access and finite non-trial grants. A new account's reserved launch gift is claimed first, even if its popup has not loaded yet. During that free month the promo form explains in Uzbek, English or Russian that the extra three months follow the free month and the saved code does not need to be entered again. Accounts without existing access receive PRO immediately. Unlimited access is preserved.

`CampaignRedemption` stores each account's code, month count, reward start and expiry. A billing transaction lock and the `(userId, code)` primary key prevent repeated or simultaneous requests from extending access twice. The PRO subscription extends in the same transaction, so renewal needs no timer or background job. Signup links with `?promo=Firdavss7` or `?ref=Firdavss7` use the same redemption endpoint after authentication.

Migration `20261031100000_firdavss7_campaign` also grants the extra three months to existing accounts recorded as invitees of the `FIRDAVSS7` referral code or owners of a redeemed personal promo with that code. It claims a reserved launch month first where needed. Accounts whose earlier access expired receive three fresh months from migration time. Unrelated invitations and unredeemed personal codes receive no campaign reward.

The production backend must apply the migration before serving the new code. Its normal `npm start` already runs `prisma migrate deploy`. Deploy the frontend alongside it to show the new messages.

Validation: `npm --prefix backend run test:billing`, `npm run test:billing-ui`, and `npm run build`.
