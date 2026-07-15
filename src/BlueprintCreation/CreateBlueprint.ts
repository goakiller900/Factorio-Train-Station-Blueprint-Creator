import pako from "pako"
import { type defaultSettings, fluidStation, normalStation } from "../constants/constants"
import type { iBlueprint, iBlueprintItem, iWireColor } from "../constants/interfaces"
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

type iBlueprintWire = [number, number, number, number]

const getCircuitConnectorId = (connectionPoint: "1" | "2", color: iWireColor): number => {
	const pointOffset = connectionPoint === "1" ? 0 : 2
	const colorOffset = color === "red" ? 1 : 2
	return pointOffset + colorOffset
}

const serializeEntitiesAndWires = (items: iBlueprintItem[]): { entities: iBlueprintItem[]; wires: iBlueprintWire[] } => {
	const wires: iBlueprintWire[] = []
	const seenWires = new Set<string>()

	const entities = items.map((item) => {
		for (const connectionPoint of ["1", "2"] as const) {
			const connectionGroup = item.connections?.[connectionPoint]
			if (!connectionGroup) continue

			for (const color of ["red", "green"] as const) {
				const connections = connectionGroup[color] ?? []
				for (const connection of connections) {
					const targetConnectionPoint = connection.circuit_id === 2 ? "2" : "1"
					const sourceConnectorId = getCircuitConnectorId(connectionPoint, color)
					const targetConnectorId = getCircuitConnectorId(targetConnectionPoint, color)

					const sourceKey = `${item.entity_number}:${sourceConnectorId}`
					const targetKey = `${connection.entity_id}:${targetConnectorId}`
					const wireKey = sourceKey < targetKey ? `${sourceKey}|${targetKey}` : `${targetKey}|${sourceKey}`

					if (!seenWires.has(wireKey)) {
						seenWires.add(wireKey)
						wires.push([item.entity_number, sourceConnectorId, connection.entity_id, targetConnectorId])
					}
				}
			}
		}

		const serializedItem = { ...item }
		delete serializedItem.connections
		return serializedItem
	})

	return { entities, wires }
}

const encode = (items: iBlueprintItem[]): string => {
	const { entities, wires } = serializeEntitiesAndWires(items)
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
			entities,
			...(wires.length > 0 ? { wires } : {}),
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
