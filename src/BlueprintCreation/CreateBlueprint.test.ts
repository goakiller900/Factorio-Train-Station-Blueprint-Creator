import pako from "pako"
import { defaultSettings } from "../constants/constants"
import { createBlueprint, createBlueprintString } from "./CreateBlueprint"

type SerializedBlueprint = {
	blueprint: {
		version: number
		entities: Array<Record<string, any>>
		wires?: Array<[number, number, number, number]>
	}
}

const decodeBlueprintString = (blueprintString: string): SerializedBlueprint => {
	const compressed = Uint8Array.from(atob(blueprintString.slice(1)), (character) => character.charCodeAt(0))
	return JSON.parse(pako.inflate(compressed, { to: "string" }))
}

const generate = (settings: typeof defaultSettings): SerializedBlueprint => {
	return decodeBlueprintString(createBlueprintString(createBlueprint(settings)))
}

describe("Factorio 2.1 blueprint serialization", () => {
	it("writes a Factorio 2.1 blueprint and converts entity directions to the 16-direction format", () => {
		const result = generate({
			...defaultSettings,
			connectChestsWithGreenWire: false,
			connectBothSideWithGreenWire: false,
		})

		expect(result.blueprint.version).toBe(562954248388608)

		const inserter = result.blueprint.entities.find((entity) => entity.name === "fast-inserter")
		expect(inserter).toBeDefined()
		// The first default inserter faces LEFT internally (6), which becomes 12 in Factorio 2.x.
		expect(inserter?.direction).toBe(12)
	})

	it("serializes circuit connections as top-level wires instead of per-entity connections", () => {
		const result = generate({ ...defaultSettings })

		expect(result.blueprint.wires).toBeDefined()
		expect(result.blueprint.wires?.length).toBeGreaterThan(0)
		expect(result.blueprint.entities.every((entity) => entity.connections === undefined)).toBe(true)
	})

	it("keeps the selected inserter type when filters are enabled", () => {
		const result = generate({
			...defaultSettings,
			inserterType: "bulk-inserter",
			enableFilterInserters: true,
			filterFields: ["iron-plate", "", "", "", ""],
		})

		expect(result.blueprint.entities.some((entity) => entity.name === "filter-inserter")).toBe(false)

		const filteredInserter = result.blueprint.entities.find(
			(entity) => entity.name === "bulk-inserter" && entity.use_filters === true,
		)
		expect(filteredInserter).toBeDefined()
		expect(filteredInserter?.filters?.[0]?.name).toBe("iron-plate")
	})

	it("normalizes legacy inserter and item names for base Factorio 2.1", () => {
		const result = generate({
			...defaultSettings,
			inserterType: "stack-inserter",
			enableFilterInserters: true,
			filterFields: ["effectivity-module", "", "", "", ""],
		})

		expect(result.blueprint.entities.some((entity) => entity.name === "stack-inserter")).toBe(false)
		const inserter = result.blueprint.entities.find(
			(entity) => entity.name === "bulk-inserter" && entity.use_filters === true,
		)
		expect(inserter).toBeDefined()
		expect(inserter?.filters?.[0]?.name).toBe("efficiency-module")
	})

	it("serializes requester chest requests using Factorio 2.x logistic sections", () => {
		const result = generate({
			...defaultSettings,
			stationType: "Unloading Station",
			chestType: "requester-chest",
			chestRequestItemsType: ["iron-plate", ...Array(11).fill("")],
			chestRequestItemsAmount: ["100", ...Array(11).fill("")],
		})

		const requesterChest = result.blueprint.entities.find(
			(entity) =>
				entity.name === "requester-chest" &&
				entity.request_filters?.sections?.[0]?.filters?.some(
					(filter: Record<string, any>) => filter.name === "iron-plate",
				),
		)
		expect(requesterChest).toBeDefined()
		expect(Array.isArray(requesterChest?.request_filters)).toBe(false)
		expect(requesterChest?.request_filters?.sections?.[0]?.index).toBe(1)
		expect(requesterChest?.request_filters?.sections?.[0]?.filters?.[0]).toMatchObject({
			index: 1,
			name: "iron-plate",
			count: 100,
		})
		expect(requesterChest?.request_from_buffers).toBeUndefined()
	})

	it("serializes decider conditions and train-stop enable flags using the Factorio 2.x format", () => {
		const result = generate({
			...defaultSettings,
			trainStopUsesEnabledCondition: true,
		})

		const trainStop = result.blueprint.entities.find((entity) => entity.name === "train-stop")
		expect(trainStop?.control_behavior?.circuit_enabled).toBe(true)
		expect(trainStop?.control_behavior?.circuit_enable_disable).toBeUndefined()

		const decider = result.blueprint.entities.find((entity) => entity.name === "decider-combinator")
		expect(decider?.control_behavior?.decider_conditions?.conditions).toHaveLength(1)
		expect(decider?.control_behavior?.decider_conditions?.outputs).toHaveLength(1)
		expect(decider?.control_behavior?.decider_conditions?.first_signal).toBeUndefined()
	})

	it("preserves existing stacker geometry with legacy rail prototypes", () => {
		const result = generate({
			...defaultSettings,
			stationType: "Stacker",
		})

		expect(result.blueprint.entities.some((entity) => entity.name === "legacy-curved-rail")).toBe(true)
		expect(result.blueprint.entities.some((entity) => entity.name === "curved-rail")).toBe(false)
		expect(result.blueprint.entities.some((entity) => entity.name === "legacy-straight-rail")).toBe(true)
	})
})
