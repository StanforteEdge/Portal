# Postman Finance Flow

Import both files:
- `api/postman/stanforteedge-finance-flow.postman_collection.json`
- `api/postman/stanforteedge-finance-flow.postman_environment.json`

Run in this order:
1. Auth requests (staff, approver, finance)
2. `Requests - List Types`
3. `Files - Create Asset`
4. `Requests - Create Draft`
5. Continue sequentially to `Generate Voucher`

Notes:
- Collection expects API base at `http://localhost:3000` with `v1` prefix.
- Update passwords/users in the environment before running.
- If your approval flow has more steps, repeat the approve request with the right actor token until status reaches `cleared`.
