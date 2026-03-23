# TODO

## Code Quality

**Magic string element IDs**
Multiple files reference element IDs as raw strings (`'gameDescription'`, `'current'`, `'setup'`, etc.).
A typo silently returns `null` and fails at runtime instead of compile time.
Consolidate into a shared constants module so mismatches are caught by the compiler.
