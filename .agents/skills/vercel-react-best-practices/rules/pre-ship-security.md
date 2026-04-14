
Bookmark this. Use it every time.

AUTHENTICATION
[ ] Passwords hashed with bcrypt or argon2 (minimum 12 rounds)
[ ] Tokens stored in httpOnly cookies — not localStorage
[ ] JWT secret is random, at least 32 characters, not from a tutorial
[ ] Access tokens expire (15 to 60 minutes max)
[ ] Refresh token rotation implemented
[ ] Rate limiting on /login and /register
[ ] Account lockout after repeated failures
[ ] Sessions invalidated server-side on logout
[ ] Email verification required before access granted

API SECURITY
[ ] Every route verified for authentication (check all endpoints, not just obvious ones)
[ ] Authorization checked: each user can only access their own data
[ ] All request inputs validated with schema validation (Zod, Joi, etc.)
[ ] API responses never include passwords, hashes, or internal fields
[ ] Error messages don't reveal system internals or file paths
[ ] Rate limiting on all public-facing endpoints
[ ] CORS restricted to your domain (not wildcard *)
[ ] HTTPS enforced, HTTP redirected

DATABASE
[ ] No SQL string concatenation (use parameterized queries or ORM)
[ ] Application uses a limited-permission DB user, not root
[ ] Database not publicly accessible (behind VPC or firewall rule)
[ ] Backups configured and restore has been tested (not just backup)
[ ] Sensitive fields encrypted at rest

INFRASTRUCTURE
[ ] All secrets in environment variables, not source code
[ ] .env not in git history (run: git log -- .env)
[ ] SSL certificate installed and valid
[ ] Server not running as root user
[ ] Only ports 80 and 443 publicly accessible

CODE
[ ] No console.log statements in production build
[ ] `npm audit` run, all critical vulnerabilities resolved
[ ] No hardcoded credentials anywhere in the codebase

20 things that will get your VIBE CODED app HACKED in 24 hours :

Bookmark this RIGHT NOW !

1/ API keys hardcoded in frontend JS
> anyone who opens devtools can read them
> cursor does this constantly
> move all keys to your backend, never the client

2/ no rate limiting on /login
> bots can try 10,000 combos while you sleep
> add rate limiting + lockout after 5 failed attempts
> this is table stakes, not optional

3/ SQL queries built with string concatenation
> "SELECT * FROM users WHERE id=" + userId
> thats SQL injection waiting to happen
> use parameterized queries, always

4/ CORS set to wildcard (*)
> any website can make authenticated requests to your API
> it uses your users own cookies to do it
> whitelist specific origins only

5/ JWTs stored in localStorage
> one XSS attack steals every token on your site
> localStorage is readable by any script on the page
> use httpOnly cookies instead

6/ JWT secret is "secret" or from a tutorial
> attackers test common secrets first
> yours is probably on a wordlist already
> generate a 256-bit random secret, rotate it

7/ admin routes protected only in the frontend
> the server doesnt care about your React Router guards
> hit the endpoint directly and it opens right up
> protect every route server-side, no exceptions

8/ .env committed to git even once
> its in the history even if you deleted the file
> git log --all --full-history -- .env finds it instantly
> rotate every key in that file immediately

9/ error responses showing stack traces or DB table names
> you're giving attackers a map of your infrastructure
> log errors server-side, return generic messages client-side
> never expose internals in a response

10/ file uploads with no MIME type validation
> upload a server-side script, get full access
> extension checks alone dont protect you
> validate MIME type server-side, not the filename

11/ passwords hashed with MD5 or SHA1
> rainbow tables crack MD5 in seconds
> no salt = no protection
> use bcrypt or argon2, no exceptions

12/ auth tokens that never expire
> stolen session = permanent access forever
> set an expiry on every token you issue
> implement refresh token rotation

13/ auth middleware missing on internal API routes
> AI adds middleware to obvious routes and skips the rest
> audit every single endpoint manually
> assume nothing is protected until you verify it

14/ server running as root
> one exploit = full system access
> run your app as a non-privileged user
> this costs nothing to fix

15/ database port exposed to the internet
> your postgres on port 5432 should never have a public IP
> put it behind a firewall or private network
> this is a one-click fix in most cloud providers

16/ IDOR vulnerability on resource endpoints
> change the ID in the URL
> can you access another users data? most vibe coded apps: yes
> validate ownership server-side on every resource request

17/ no HTTPS enforcement
> credentials sent over plain HTTP can be intercepted on any public network
> enforce HTTPS at the server level, not just the frontend
> redirect all HTTP traffic automatically

18/ sessions not invalidated on logout
> the old session token still works after the user clicks logout
> invalidate sessions server-side on every logout event
> client-side cookie clearing is not enough

19/ npm packages not audited since setup
> run npm audit right now
> count the criticals
> schedule this as part of every deploy

20/ open redirects in callback URLs
> used to send users to phishing sites through your trusted domain
> validate and whitelist every redirect destination
> never trust user-supplied redirect URLs

bookmark this and run a security audit before you ship.

Every unchecked box is a risk you're choosing to ship with.
