import pako from "pako"
import { type defaultSettings, fluidStation, normalStation } from "../constants/constants"
import type { iBlueprint, iBlueprintItem } from "../constants/interfaces"
import { createFluidStation } from "./CreateFluidStation"
import { createNormalStation } from "./CreateNormalStation"
import { createStacker } from "./CreateStacker"

export const createBlueprint = (bpSettings: typeof defaultSettings): iBlueprintItem[] => {
	if (normalStation.includes(bpSettings.stationType)) {
		return createNormalStation(bpSettings)
	}
	if (fluidStation.includes(bpSettings.stationType)) {
		return createFluidStation(bpSettings)
	} else if (bpSettings.stationType === "Stacker") {
		return createStacker(bpSettings)
	}
	return []
}

const decode = (blueprintString: string): iBlueprint => {
	// UNTESTED stolen from https://github.com/demipixel/factorio-blueprint/blob/c21309e9023ee3740a5c3c647d87cb828ab3ecc4/src/util.ts#L20
	return JSON.parse(
		pako.inflate(
			Uint8Array.from(atob(blueprintString.slice(1)), (c) => c.charCodeAt(0)),
			{ to: "string" },
		),
	)
}

// Factorio stores blueprint versions as a packed 64-bit integer:
// major << 48 | minor << 32 | patch << 16 | build.
const FACTORIO_BLUEPRINT_VERSION = 562954248388608 // 2.1.0.0

const encode = (items: iBlueprintItem[]): string => {
	const blueprint = {
		blueprint: {
			icons: [
				{
					signal: {
						type: "item",
						name: "transport-belt",
					},
					index: 1,
				},
			],
			entities: items,
			item: "blueprint",
			version: FACTORIO_BLUEPRINT_VERSION,
			label: "Blueprint",
		},
	}
	return "0" + btoa(String.fromCharCode(...Array.from(pako.deflate(JSON.stringify(blueprint), { level: 9 }))))
}

export const createBlueprintString = (blueprint: iBlueprint): string => {
	// Stolen from https://github.com/demipixel/factorio-blueprint/blob/c21309e9023ee3740a5c3c647d87cb828ab3ecc4/src/util.ts#L41
	return encode(blueprint)
}
