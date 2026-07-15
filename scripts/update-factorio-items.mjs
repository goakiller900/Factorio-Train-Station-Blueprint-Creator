import { access, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"

const wikiUrl = "https://wiki.factorio.com/Data.raw"
const fallbackDataRawUrl = "https://gist.githubusercontent.com/Bilka2/6b8a6a9e4a4ec779573ad703d03c1ae7/raw"
const outputPath = fileURLToPath(new URL("../src/constants/itemlist.json", import.meta.url))

const fetchText = async (url) => {
	const response = await fetch(url, {
		headers: {
			"User-Agent": "Factorio-Train-Station-Blueprint-Creator item-list updater",
		},
	})

	if (!response.ok) {
		throw new Error(`Request failed for ${url}: ${response.status} ${response.statusText}`)
	}

	return response.text()
}

const findDataRawUrl = async () => {
	try {
		const wikiHtml = await fetchText(wikiUrl)
		const gistMatch = wikiHtml.match(/https:\/\/gist\.githubusercontent\.com\/[^\"'<>&\s]+\/raw(?:\/[^\"'<>&\s]*)?/)
		return gistMatch?.[0] ?? fallbackDataRawUrl
	} catch (error) {
		console.warn(`Could not read the Factorio wiki data.raw page: ${error.message}`)
		return fallbackDataRawUrl
	}
}

const extractItemNames = (dataRaw) => {
	const itemNames = new Set()

	for (const prototypeGroup of Object.values(dataRaw)) {
		if (!prototypeGroup || typeof prototypeGroup !== "object" || Array.isArray(prototypeGroup)) continue

		for (const [prototypeName, prototype] of Object.entries(prototypeGroup)) {
			if (!prototype || typeof prototype !== "object" || Array.isArray(prototype)) continue

			// All ItemPrototype-derived prototypes have stack_size. Using the prototype data
			// instead of a hard-coded type list also picks up specialized item prototype types.
			if (!("stack_size" in prototype)) continue

			const itemName = typeof prototype.name === "string" ? prototype.name : prototypeName
			if (itemName) itemNames.add(itemName)
		}
	}

	return [...itemNames].sort((a, b) => a.localeCompare(b))
}

const updateItemList = async () => {
	const dataRawUrl = await findDataRawUrl()
	console.log(`Updating Factorio item autocomplete from ${dataRawUrl}`)

	const serializedDataRaw = await fetchText(dataRawUrl)
	const dataRaw = JSON.parse(serializedDataRaw)
	const itemNames = extractItemNames(dataRaw)

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
