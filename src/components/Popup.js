import {
	html,
} from "https://npm.reversehttp.com/preact,preact/hooks,htm/preact,goober";

export default function Popup(props) {
	const { class: classStr, style, ...rest } = props;
	return html`
		<div class="PopupSymbol ${classStr}" style=${style} ...${rest}>
			<div class="PopupSymbol__content">
				${rest.default || props.children}
			</div>
		</div>
	`;
}