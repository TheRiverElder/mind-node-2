
interface IconProps {
    name: string;
    size?: number | string;
}
 
function Icon(props: IconProps) { 
    const rowSize = props.size || 'auto';
    const size = typeof rowSize === 'number' ? rowSize + 'px' : rowSize;
    return (
        <img 
            alt={ props.name }
            src={ 'icons/' + props.name + '.svg' }
            style={{
                width: size,
                height: size,
            }}
        />
    );
}
 
export default Icon;