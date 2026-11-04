# Claims to verify before launch

Each item is marked in the project's MDX file as a hidden `{/* TODO(verify) */}` comment. None of them show on the site. Confirm or correct each one, then delete its comment.

| Project | Claim or gap | Why it needs checking |
|---|---|---|
| Kedge | "Two startups contacted me about using it" | Stated in chat; no written source. |
| Kedge | Trimming CI logs keeps the agent's context focused | The reason is inferred from the code (`gitgh.py`), not from your notes. |
| Bulkhead | The reasons for "the contract builds the transaction" and "one asset per tier" | Taken from the spec and handoff notes; confirm they match your thinking. |
| GafferScore AI agent | The key decisions (Poisson base, lineup adjustment, weekly schedule) and CatBoost's role | Inferred from `gaffer-engine` script names and the `.github` folder. |
| Prador | The whole page | No repo or notes were available; the page only uses the old portfolio copy. |
| Tektradoor | tektradoor.com itself still says "Runs autonomously on your Bybit account" | You no longer connect to exchanges. The portfolio screenshots hide that line, but the live site needs updating. |

## Not on the site yet

- Chogathon and Monad Metropolis results: add when announced.
- Bulkhead code link: add when the repo goes public (after November 14).
- Base NFT and Ethereum deployments: send a repo or contract address to turn them into a project or proof line.
