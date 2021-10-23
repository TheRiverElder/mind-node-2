import { ReactNode } from 'react';
import '../styles/RadioButton.css';
import { toClassName } from '../util/javascript-extension';

interface RadioButtonProps {
    children?: ReactNode;
    border?: boolean;
    value: boolean;
    onChange: (value: boolean) => void;
}
 
function RadioButton(props: RadioButtonProps) {
    return (
        <div 
            className={ toClassName({ "RadioButton": true, border: !!props.border, checked: props.value }) }
            onClick={ () => props.onChange(!props.value) }    
        >
            { props.children }
        </div>
    )
}
 
export default RadioButton;