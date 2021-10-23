import { ReactNode } from 'react';
import '../styles/RadioButton.css';
import { toClassName } from '../util/javascript-extension';

interface RadioButtonProps {
    children?: ReactNode;
    value: boolean;
    onChange: (value: boolean) => void;
}
 
function RadioButton(props: RadioButtonProps) {
    return (
        <div 
            className={ toClassName({ "RadioButton": true, checked: props.value }) }
            onClick={ () => props.onChange(!props.value) }    
        >
            { props.children }
        </div>
    )
}
 
export default RadioButton;