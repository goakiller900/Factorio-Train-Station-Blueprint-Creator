import type { iInserterTypes } from "./interfaces"

// Legacy names that are still present in old shared links and the original 1.x autocomplete data.
// Most of these come directly from Factorio's 2.0 migration table. The stack-inserter alias is
// normalized to bulk-inserter so generated blueprints remain compatible with base Factorio 2.1.
const factorio21ItemRenames: Record<string, string> = {
	"empty-barrel": "barrel",
	"filter-inserter": "fast-inserter",
	"stack-filter-inserter": "bulk-inserter",
	"stack-inserter": "bulk-inserter",
	"fusion-reactor-equipment": "fission-reactor-equipment",
	"logistic-chest-passive-provider": "passive-provider-chest",
	"logistic-chest-active-provider": "active-provider-chest",
	"logistic-chest-storage": "storage-chest",
	"logistic-chest-buffer": "buffer-chest",
	"logistic-chest-requester": "requester-chest",
	"effectivity-module": "efficiency-module",
	"effectivity-module-2": "efficiency-module-2",
	"effectivity-module-3": "efficiency-module-3",
}

export const normalizeFactorio21ItemName = (name: string): string => factorio21ItemRenames[name] ?? name

export const normalizeFactorio21EntityName = (name: string): string => {
	if (name === "filter-inserter") return "fast-inserter"
	if (name === "stack-filter-inserter" || name === "stack-inserter") return "bulk-inserter"
	return name
}

export const normalizeFactorio21InserterType = (name: string): iInserterTypes => {
	return normalizeFactorio21EntityName(name) as iInserterTypes
}
