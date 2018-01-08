import React from 'react';
import { Form, Input, Label } from 'semantic-ui-react';

export function CurrencyFormatter(props)
{
    return ("$" + props.value.toFixed(2).replace(/(\d)(?=(\d{3})+\.)/g, '$1,'));
}

export function CurrencyFormField(props)
{
    const { name, label, onChange, hideLabel, ...other } = props;

    return (
        <Form.Field {...other}>
            {!hideLabel && <label>{label}</label>}
            <Input name={name} type="number" step=".01" labelPosition='left' placeholder={label} onChange={onChange}>
                <Label>$</Label>
                <input />
            </Input>
        </Form.Field>
    );
}

export function PercentageFormatter(props)
{
    return ((props.value * 100).toString() + "%");
}

export function PercentageFormField(props)
{
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