import React from 'react';
import { Form, Input, Label } from 'semantic-ui-react';
import { SimpleDate } from './SimpleDate.js';

export function CurrencyFormatter(props) {
    return ("$" + (Math.round(props.value * 100.0) / 100.0).toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'));
}

export function CurrencyFormField(props) {
    const { name, label, onChange, hideLabel, children, defaultValue, ...other } = props;

    return (
        <Form.Field {...other}>
            {!hideLabel && <label>{label}</label>}
            <CurrencyInput name={name} defaultValue={defaultValue} placeholder={label} onChange={onChange}>
                {children}    
            </CurrencyInput>    
        </Form.Field>
    );
}

export function CurrencyInput(props) {
    return (
        <Input name={props.name} type="number" step=".01" action={props.children !== undefined} labelPosition='left' defaultValue={props.defaultValue} placeholder={props.label} onChange={props.onChange}>
            <Label>$</Label>
            <input />
            {props.children}
        </Input>
    );
}

export function DateFormatter(props) {
    let month = (props.value.getMonth() + 1).toString();

    if (month.length === 1) {
        month = "0" + month;
    }

    return (month + "-" + props.value.getFullYear().toString());
}

export function SimpleDateFormatter(props) {
    return SimpleDate.toMonthYearString(props.value);
}

export function PercentageFormatter(props) {
    return ((props.value * 100).toString() + "%");
}

export function PercentageFormField(props) {
    const { name, label, onChange, ...other } = props;

    return (
        <Form.Field {...other}>
            <label>{label}</label>
            <Input type="number" name={name} step=".01" labelPosition='right' placeholder={label} onChange={onChange}>
                <input />
                <Label>%</Label>
            </Input>
        </Form.Field>
    );
}