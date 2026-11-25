# Timestamped writeups

The canonical source for a timestamped post lives at
`site/assets/writing/<slug>.md`, beside `<slug>.md.ots`. The article links to
both files. Cite sources by linking existing phrases directly to primary sources.

Finalize the wording, Markdown syntax, and citation URLs **before** stamping:

```sh
ots stamp site/assets/writing/<slug>.md
ots info site/assets/writing/<slug>.md.ots
ots verify site/assets/writing/<slug>.md.ots
```

New receipts are initially pending. Once Bitcoin confirmation is available:

```sh
ots upgrade site/assets/writing/<slug>.md.ots
ots verify site/assets/writing/<slug>.md.ots
```

Publish the upgraded receipt as well. CLI Bitcoin verification needs a Bitcoin
Core node. See the [OpenTimestamps client documentation](https://github.com/opentimestamps/opentimestamps-client).
The article also links to the browser verifier.

Keep the Markdown immutable after stamping, including its citation URLs and
whitespace. For a later revision, retain the old source and proof, create a new
versioned filename, and stamp that version separately. `.gitattributes` disables
line-ending conversion for these artifacts. Do not pass them through a formatter.

The HTML article's text must match the canonical Markdown; navigation and
verification instructions sit outside the article. Keep source PDFs and
conversion checks in ignored `.local-review/`, outside public assets.

## First post

`mechinterp-can-push-the-pareto-frontier.md`

SHA-256: `6651a78a6b898f60af41079fcd9d32aa97800023a1259ae887807deb51b7c51d`

The receipt was upgraded successfully on November 24, 2026: `ots upgrade`
reported `Success! Timestamp complete`. Include this upgraded `.md.ots` in the
next push. The Markdown hash is unchanged. Local `ots verify` could not complete
because no Bitcoin Core node is configured; completed proof retrieval is not
the same as independently verifying the Bitcoin chain. Verification commands
and the browser-verifier alternative are linked on the article.
