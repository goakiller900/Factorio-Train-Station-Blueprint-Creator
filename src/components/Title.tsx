import { websiteUrl } from "../constants/constants"
import { CLASSES } from "../css/classes"

export default function Title(): JSX.Element {
	return (
		<a className={CLASSES.title} target="_blank" rel="noreferrer noopener" href={websiteUrl}>
			{"Train Station Blueprint Creator — Factorio 2.1"}
		</a>
	)
}
