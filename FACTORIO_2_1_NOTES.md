# Factorio 2.1 compatibility notes

This branch is a work in progress for updating generated blueprints for Factorio 2.1.

## Updated so far

- Generate blueprints with a Factorio 2.1 version value.
- Convert legacy per-entity circuit `connections` into top-level blueprint `wires` during serialization.
- Keep the selected inserter entity when filters are enabled instead of generating the removed `filter-inserter` entity.
- Point production/GitHub Pages URLs at this fork.

## Still to verify in-game

- Inserter filter serialization.
- Requester/buffer chest request serialization.
- Arithmetic and decider combinator control behavior.
- Dynamic train-limit circuit behavior.
- All normal/fluid station layouts.
- All stacker layouts and rail geometry.
