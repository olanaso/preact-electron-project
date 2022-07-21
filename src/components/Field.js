
import {
  html,
} from "https://npm.reversehttp.com/preact,preact/hooks,htm/preact,goober";

import { isFieldInvalid } from "../functions.js";

import Icon from "./Icon.js";

export default function Field(props) {
	const {
		title,
		items,
		value,
		labelProp = 'Description',
		valueProp = 'Id',
		name,
		inputType = 'text',
		placeholder = '',
		disabled,
		fieldInfo,
		class: classStr,
		style,
		step,
		min,
		max,
		maxlength,
		...rest
	} = props;
	const isCombo = inputType == 'combo' && items;
	// TODO: mejorar
	const isDisabled = disabled || context.get('page') == 'viewDownload';
	return html`
		<div class="Field ${classStr}" style=${style} ...${rest}>
			<div>${title}</div>
			<div class="Value ${isFieldInvalid(fieldInfo) ? 'Value--error' : ''}">
				<${Icon} class="Value__iconError" icon="error1" />
				${isCombo ? html`
					<select  class="Value__input ${isDisabled ? 'Value__input--disabled' : '' }"
						value="${value}" labelProp="${labelProp}" valueProp="${valueProp}"
						name="${name}" disabled="${isDisabled}">
						<option value="" selected="${!value}">Selecciona...</option>
						${(items || []).map(opt => html`
							<option value="${opt[valueProp]}" selected="${value === opt[valueProp]}">${opt[labelProp]}</option>
						`)}
					</select>
				` : html`
					<input  class="Value__input ${isDisabled ? 'Value__input--disabled' : '' }"
						value="${value}" placeholder="${placeholder}" type="${inputType}"
						name="${name}"
						disabled="${isDisabled}"
						step=${step}
						min=${min}
						max=${max}
						maxlength=${maxlength}
					/>
				`}
				<div class="Value__popupError">
					<div class="Value__arrowPopup"></div>
					<div>${fieldInfo && fieldInfo.errors.join('. ')}</div>
				</div>
			</div>
		</div>
	`;
}