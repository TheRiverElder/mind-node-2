import { Component, RefObject, useState } from "react";
import LocalStorageDataPersistence, { LocalStorageDataPersistenceView } from "./LocalStorageDataPersistence";
import SSSPDataPersistence, { SSSPDataPersistenceView } from "./SSSPDataPersistence";
import TextDataPersistence, { TextDataPersistenceView } from "./TextDataPersistence";
import TranditionalDataPersistence from "./TranditionalDataPersistence";
import Selector from "./Selector";
import DataPersistence from "../persistence/DataPersistence";
import { MindNodePool } from "../interfaces";

export interface PersistenceSelection {
    name: string;
    id: string;
    value: DataPersistence;
    conponent: typeof Component<any, any, any>;
}

const persistences: PersistenceSelection[] = [
    { name: "文本", id: "text", conponent: TextDataPersistenceView, value: new TextDataPersistence() },
    { name: "SSSP", id: "sssp", conponent: SSSPDataPersistenceView, value: new SSSPDataPersistence() },
    // { name: "传统", id: "tranditional", conponent: TranditionalDataPersistence },
    { name: "浏览器存储", id: "local_storage", conponent: LocalStorageDataPersistenceView, value: new LocalStorageDataPersistence() },
];

export function getAllPersistences() {
    return persistences;
}

export function getDefaultPersistenceSelection() {
    return persistences[0];
}

export interface FileSavingSettingsViewProps {
    value: PersistenceSelection;
    onChange?: (value: PersistenceSelection) => void;
    ref?: RefObject<Component & DataPersistence>;
    onSave?: () => void;
    onLoad?: () => void;
}

export default function FileSavingSettingsView({ value, onChange, ref, onSave, onLoad }: FileSavingSettingsViewProps) {
    
    const [persistence, setPersistence] = useState<PersistenceSelection>(value);
    const Component = persistence.conponent;

    function onPersistenceChange(o: PersistenceSelection) {
        setPersistence(o);
        onChange && onChange(o);
    }

    return (
        <div className="FileSavingSettingsView">
            <span>保存方式：</span>
            <Selector
                value={persistence.id}
                options={persistences}
                getText={o => o.name}
                getValue={o => o.id}
                onChange={onPersistenceChange}
            />
            <Component ref={ref} persistence={persistence.value} />
            <div className="button-bar">
                <button onClick={onSave}>保存</button>
                <button onClick={onLoad}>载入</button>
            </div>
        </div>
    )
}