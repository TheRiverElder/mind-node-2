import { createRef, ReactNode, RefObject } from "react";
import "../styles/NavigationBar.css";
import { toClassName } from "../util/lang";
import { Vec2, X, Y } from "../util/mathematics";

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
                {items.map(item => (<NavigationBarListItem item={item} main />))}
            </ul>
        </nav>
    )
}

function NavigationBarList({ list, position: [posX, posY] }: { list: Array<NavigationBarItem>, position: Vec2 }) {
    return (
        <ul
            className="list"
            style={{
                left: `${posX}px`,
                top: `${posY}px`,
            }}
        >
            {list.map(item => (
                <NavigationBarListItem item={item} />
            ))}
        </ul>
    );
}

function NavigationBarListItem({ item, main: isMain = false }: { item: NavigationBarItem, main?: boolean }) {
    if (typeof item === 'string') return (<li className={toClassName({ "item": true, "main-item": isMain })}></li>);

    const { text, icon, disabled = false, children, onClick } = item;

    const ref = createRef<HTMLElement>();

    return (
        <li
            className={toClassName({ "item": true, "main-item": isMain, disabled })}
            onClick={onClick}
        >
            <span>{text}</span>
            {icon && (<span>{icon}</span>)}
            {children && (<NavigationBarList list={children} position={getPosition(ref, isMain ? 'bottom' : 'right')} />)}
        </li>
    );
}

function getPosition(ref: RefObject<HTMLElement | null>, direction: 'bottom' | 'right'): Vec2 {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return [0, 0];

    switch (direction) {
        case 'bottom': return [rect.x, rect.y + rect.height];
        case 'right': return [rect.x + rect.width, rect.y];
        default: return [0, 0];
    }
}