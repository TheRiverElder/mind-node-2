import { ChangeEvent, Component, ReactNode } from "react";

export interface SelectorProps<TOption> {
    value: string;
    disabled?: boolean;
    options: TOption[];
    getText: (option: TOption) => string;
    getValue: (option: TOption) => string;
    onChange: (option: TOption) => void;
}

export default class Selector<TOption> extends Component<SelectorProps<TOption>> {
    render(): ReactNode {
        const p = this.props;
        return (
            <select value={p.value} disabled={p.disabled} onChange={this.onChange} >
                {this.props.options.map(o => (
                    <option key={p.getValue(o)} value={p.getValue(o)}>{p.getText(o)}</option>
                ))}
            </select>
        );
    }

    onChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        const p = this.props;
        const option = p.options.find(o => p.getValue(o) === value);
        if (option) {
            p.onChange(option);
        }
    }
}