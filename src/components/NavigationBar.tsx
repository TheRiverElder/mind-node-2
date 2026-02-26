import { ReactNode, useState } from "react";
import "../styles/NavigationBar.css";
import { toClassName } from "../util/lang";

export interface NavigationBarProps {
    items: Array<NavigationBarItem>;
}

export type NavigationBarItem = NavigationBarFullItem | string;

export interface NavigationBarFullItem {
    text: string | ReactNode;
    icon?: string | ReactNode;
    disabled?: boolean; // 默认false
    children?: Array<NavigationBarItem>;
    onClick?: () => void;
}

export default function NavigationBar({ items }: NavigationBarProps) {
    return (
        <nav className="NavigationBar">
            <ul>
                {items.map((item, key) => (<NavigationBarListItem key={key} item={item} main />))}
            </ul>
        </nav>
    )
}

function NavigationBarList({ list, position }: { list: Array<NavigationBarItem>, position: 'bottom' | 'right' }) {
    return (
        <ul
            className="list dropdown"
            style={position === "bottom" ? {
                left: `0`,
                top: `100%`,
            } : {
                left: `100%`,
                top: `0`,
            }}
        >
            {list.map((item, key) => (
                <NavigationBarListItem key={key} item={item} />
            ))}
        </ul>
    );
}

function NavigationBarListItem({ item, main: main = false }: { item: NavigationBarItem, main?: boolean }) {
    if (typeof item === 'string') return (<li className={toClassName({ "item": true, "main-item": main })}></li>);

    const { text, icon, disabled = false, children, onClick } = item;

    const [shouldShowChildren, setShouldShowChildren] = useState(false);
    
    return (
        <li
            className={toClassName({ "item": true, "main-item": main, disabled })}
            onClick={onClick}
            onMouseEnter={() => setShouldShowChildren(true)}
            onMouseLeave={() => setShouldShowChildren(false)}
        >
            <span className="text">{text}</span>
            {icon && (<span>{icon}</span>)}
            {(children && shouldShowChildren) && (<NavigationBarList list={children} position={main ? 'bottom' : 'right'} />)}
        </li>
    );
}