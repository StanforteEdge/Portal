# Debug: 500 on /v1/finance/statutory-deductions/:id/pdf

Run this on the production server (SSH in first) to get the real stack trace
for the failing request:

```bash
pm2 logs api --lines 100 --nostream | grep -A 20 "statutory-deductions\|TypeError\|Cannot read"
```

If that doesn't show anything useful, just dump the last 200 lines instead
and paste them back:

```bash
pm2 logs api --lines 200 --nostream
```

Paste whatever it prints back into the chat.
