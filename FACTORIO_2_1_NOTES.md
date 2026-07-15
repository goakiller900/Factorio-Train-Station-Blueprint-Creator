# Factorio 2.1 compatibility notes

This branch is a work in progress for updating generated blueprints for Factorio 2.1.

## Updated so far

- Generate blueprints with a Factorio 2.1 version value.
- Convert generated directions from the pre-2.0 8-direction scale to the Factorio 2.x 16-direction scale.
- Convert legacy per-entity circuit `connections` into top-level blueprint `wires` during serialization.
- Preserve combinator input/output circuit connector numbers when converting wires.
- Keep the selected inserter entity when filters are enabled instead of generating the removed `filter-inserter` entity.
- Export requester/buffer chest requests using Factorio 2.x logistic sections.
- Convert legacy decider-combinator conditions to Factorio 2.x condition/output arrays.
- Convert `circuit_enable_disable` to the current `circuit_enabled` control-behavior field.
- Preserve old stacker geometry with `legacy-straight-rail` and `legacy-curved-rail` until the stacker templates are rebuilt for the new rail system.
- Point production/GitHub Pages URLs at this fork.
- Add serialization regression tests and run them before the production build in GitHub Actions.

## Still to verify in-game

- Normal loading and unloading stations.
- Fluid loading and unloading stations.
- Inserter filters with each supported inserter type.
- Requester/buffer chest requests and automatic refuel requester chests.
- Madzuri loading/unloading circuit behavior.
- Dynamic train-limit circuit behavior.
- Train-stop enable conditions.
- Vertical and diagonal stackers using the temporary legacy-rail compatibility path.

## Planned follow-up

- Rebuild the stacker rail templates using Factorio 2.x `straight-rail`, `half-diagonal-rail`, `curved-rail-a`, and `curved-rail-b` geometry instead of the legacy rail prototypes.
