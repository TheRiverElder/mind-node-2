import { MouseEvent, ReactNode } from 'react';
import '../styles/RadioButton.css';
import { toClassName } from '../util/lang';

interface RadioButtonProps {
    children?: ReactNode;
    border?: boolean;
    value: boolean;
    onChange: (value: boolean) => void;
}

const STOP_EVENT = (e: MouseEvent) => e.stopPropagation();
 
function RadioButton(props: RadioButtonProps) {
    return (
        <div 
            className={ toClassName({ "RadioButton": true, border: !!props.border, checked: props.value }) }
            onMouseDown={ STOP_EVENT }
            onMouseUp={ STOP_EVENT }
            onClick={ () => props.onChange(!props.value) }    
        >
            { props.children }
        </div>
    )
}
 
export default RadioButton;