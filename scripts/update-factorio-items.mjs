import { access, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"

const wikiApiUrl = "https://wiki.factorio.com/api.php?action=parse&page=Data.raw&prop=text&format=json&formatversion=2"
const outputPath = fileURLToPath(new URL("../src/constants/itemlist.json", import.meta.url))

// These data.raw prototype types derive from ItemPrototype and represent inventory items that
// can be selected for inserter filters and logistic requests.
const itemPrototypeTypes = [
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
]

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

const stripHtml = (value) => {
	return value
		.replace(/<[^>]+>/g, "")
		.replace(/&nbsp;/g, " ")
		.replace(/&amp;/g, "&")
		.replace(/&#39;|&apos;/g, "'")
		.replace(/&quot;/g, '"')
		.trim()
}

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

const findPrototypeSection = (html, prototypeType) => {
	const escapedType = escapeRegExp(prototypeType)
	const h2Match = new RegExp(`<h2\\b[^>]*\\bid=["']${escapedType}["'][^>]*>`, "i").exec(html)
	const spanMatch = new RegExp(`<span\\b[^>]*\\bid=["']${escapedType}["'][^>]*>`, "i").exec(html)
	const headingMatch = h2Match ?? spanMatch
	if (!headingMatch) return ""

	const sectionStart = h2Match ? h2Match.index : html.lastIndexOf("<h2", headingMatch.index)
	if (sectionStart < 0) return ""

	const nextSectionStart = html.indexOf("<h2", sectionStart + 3)
	return html.slice(sectionStart, nextSectionStart === -1 ? html.length : nextSectionStart)
}

const extractItemNames = (html) => {
	const itemNames = new Set()

	for (const prototypeType of itemPrototypeTypes) {
		const section = findPrototypeSection(html, prototypeType)
		if (!section) {
			console.warn(`Could not find data.raw section '${prototypeType}'.`)
			continue
		}

		for (const match of section.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)) {
			const itemName = stripHtml(match[1])
			if (/^[a-z0-9][a-z0-9-]*$/.test(itemName)) itemNames.add(itemName)
		}
	}

	return [...itemNames].sort((a, b) => a.localeCompare(b))
}

const updateItemList = async () => {
	console.log(`Updating Factorio item autocomplete from ${wikiApiUrl}`)
	const apiResponse = await fetchJson(wikiApiUrl)
	const html = typeof apiResponse?.parse?.text === "string" ? apiResponse.parse.text : apiResponse?.parse?.text?.["*"]

	if (!html) throw new Error("The Factorio wiki API did not return rendered Data.raw HTML.")

	const itemNames = extractItemNames(html)
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
