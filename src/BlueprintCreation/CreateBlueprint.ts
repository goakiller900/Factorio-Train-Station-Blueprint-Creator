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
// main << 48 | major << 32 | minor << 16 | developer.
const FACTORIO_BLUEPRINT_VERSION = 562954248388608 // 2.1.0.0

type iBlueprintWire = [number, number, number, number]
type iSerializedBlueprintItem = Record<string, unknown>

const getCircuitConnectorId = (connectionPoint: "1" | "2", color: iWireColor): number => {
	const pointOffset = connectionPoint === "1" ? 0 : 2
	const colorOffset = color === "red" ? 1 : 2
	return pointOffset + colorOffset
}

const serializeControlBehavior = (item: iBlueprintItem): Record<string, unknown> | undefined => {
	if (!item.control_behavior) return undefined

	const controlBehavior: Record<string, unknown> = { ...item.control_behavior }

	// Factorio 2.x renamed the enable/disable flag while keeping the circuit condition itself.
	if (item.control_behavior.circuit_enable_disable !== undefined) {
		controlBehavior.circuit_enabled = item.control_behavior.circuit_enable_disable
		delete controlBehavior.circuit_enable_disable
	}

	// Factorio 2.x decider combinators use condition and output arrays.
	const deciderConditions = item.control_behavior.decider_conditions
	if (deciderConditions) {
		controlBehavior.decider_conditions = {
			conditions: [
				{
					first_signal: deciderConditions.first_signal,
					constant: deciderConditions.constant,
					comparator: deciderConditions.comparator,
				},
			],
			outputs: [
				{
					signal: deciderConditions.output_signal,
					copy_count_from_input: deciderConditions.copy_count_from_input,
				},
			],
		}
	}

	return controlBehavior
}

const serializeEntitiesAndWires = (
	items: iBlueprintItem[],
): { entities: iSerializedBlueprintItem[]; wires: iBlueprintWire[] } => {
	const wires: iBlueprintWire[] = []
	const seenWires = new Set<string>()
	const usesLegacyRailGeometry = items.some((item) => item.name === "curved-rail")

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

		const serializedItem: iSerializedBlueprintItem = { ...item }
		delete serializedItem.connections

		// Pre-2.0 blueprints used eight direction values. Factorio 2.x uses sixteen,
		// so all generated directions need to be doubled during serialization.
		if (item.direction !== undefined) {
			serializedItem.direction = item.direction * 2
		}

		// Existing stacker templates use the old rail geometry. Preserve those layouts
		// with the legacy rail prototypes until the stacker templates are rebuilt.
		if (usesLegacyRailGeometry) {
			if (item.name === "straight-rail") serializedItem.name = "legacy-straight-rail"
			if (item.name === "curved-rail") serializedItem.name = "legacy-curved-rail"
		}

		// Filter inserters were folded into the normal inserter prototypes in Factorio 2.x.
		// Explicitly enable filtering when the generated inserter contains filter slots.
		if (item.filters && item.filters.length > 0) {
			serializedItem.use_filters = true
		}

		// Logistic request slots became logistic sections in Factorio 2.x.
		if (item.request_filters !== undefined || item.request_from_buffers !== undefined) {
			const requestFilters: Record<string, unknown> = {}
			if (item.request_filters && item.request_filters.length > 0) {
				requestFilters.sections = [
					{
						index: 0,
						filters: item.request_filters.map((filter) => ({
							index: filter.index,
							name: filter.name,
							count: filter.count,
						})),
					},
				]
			}
			if (item.request_from_buffers !== undefined) {
				requestFilters.request_from_buffers = item.request_from_buffers
			}
			serializedItem.request_filters = requestFilters
			delete serializedItem.request_from_buffers
		}

		const controlBehavior = serializeControlBehavior(item)
		if (controlBehavior) serializedItem.control_behavior = controlBehavior

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
