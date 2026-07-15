import { access, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"

const wikiApiUrl =
	"https://wiki.factorio.com/api.php?action=parse&page=Data.raw&prop=wikitext&format=json&formatversion=2"
const outputPath = fileURLToPath(new URL("../src/constants/itemlist.json", import.meta.url))

// These are the data.raw prototype types that derive from ItemPrototype and therefore represent
// inventory items that can be used by inserter filters or logistic requests.
const itemPrototypeTypes = new Set([
	"ammo",
	"armor",
	"blueprint",
	"blueprint-book",
	"capsule",
	"copy-paste-tool",
	"deconstruction-item",
	"gun",
	"item",
	"item-with-entity-data",
	"module",
	"rail-planner",
	"remote-controller",
	"repair-tool",
	"selection-tool",
	"space-platform-starter-pack",
	"spidertron-remote",
	"tool",
	"upgrade-item",
])

const fetchJson = async (url) => {
	const response = await fetch(url, {
		headers: {
			"User-Agent": "Factorio-Train-Station-Blueprint-Creator item-list updater",
		},
	})

	if (!response.ok) {
		throw new Error(`Request failed for ${url}: ${response.status} ${response.statusText}`)
	}

	return response.json()
}

const stripWikiMarkup = (value) => {
	return value
		.replace(/<!--.*?-->/g, "")
		.replace(/\[\[(?:[^\]|]+\|)?([^\]]+)\]\]/g, "$1")
		.replace(/<[^>]+>/g, "")
		.trim()
}

const extractItemNames = (wikitext) => {
	const itemNames = new Set()
	let currentPrototypeType = ""

	for (const rawLine of wikitext.split(/\r?\n/)) {
		const line = rawLine.trim()
		const headingMatch = line.match(/^==\s*(.*?)\s*==$/)
		if (headingMatch) {
			currentPrototypeType = stripWikiMarkup(headingMatch[1])
			continue
		}

		if (!itemPrototypeTypes.has(currentPrototypeType)) continue

		const itemMatch = line.match(/^\*\s*(.+?)\s*$/)
		if (!itemMatch) continue

		const itemName = stripWikiMarkup(itemMatch[1])
		if (/^[a-z0-9][a-z0-9-]*$/.test(itemName)) itemNames.add(itemName)
	}

	return [...itemNames].sort((a, b) => a.localeCompare(b))
}

const updateItemList = async () => {
	console.log(`Updating Factorio item autocomplete from ${wikiApiUrl}`)
	const apiResponse = await fetchJson(wikiApiUrl)
	const wikitext =
		typeof apiResponse?.parse?.wikitext === "string"
			? apiResponse.parse.wikitext
			: apiResponse?.parse?.wikitext?.["*"]

	if (!wikitext) throw new Error("The Factorio wiki API did not return Data.raw wikitext.")

	const itemNames = extractItemNames(wikitext)
	if (itemNames.length < 100) {
		throw new Error(`Only found ${itemNames.length} item prototypes; refusing to replace the fallback list.`)
	}

	const itemList = itemNames.map((id) => ({ id }))
	await writeFile(outputPath, `${JSON.stringify(itemList, null, "\t")}\n`, "utf8")
	console.log(`Generated autocomplete list with ${itemNames.length} Factorio items.`)
}

try {
	await updateItemList()
} catch (error) {
	console.warn(`Could not refresh the Factorio item list: ${error.message}`)
	try {
		await access(outputPath)
		console.warn("Keeping the checked-in fallback item list so the build can continue.")
	} catch {
		throw error
	}
}
