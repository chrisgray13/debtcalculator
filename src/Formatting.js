import React from 'react';
import { Form, Input, Label } from 'semantic-ui-react';

export function CurrencyFormatter(props)
{
    return ("$" + props.value.toFixed(2).toString());
}

export function CurrencyFormField(props)
{
    return (<Form.Field>
        <label>{props.label}</label>
        <Input name={props.name} type="number" step=".01" labelPosition='right' placeholder={props.label} onChange={props.onChange}>
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
    return (<Form.Field>
        <label>{props.label}</label>
        <Input name={props.name} type="number" step=".01" labelPosition='right' placeholder={props.label} onChange={props.onChange}>
          <input />
          <Label>%</Label>
        </Input>
      </Form.Field>
    );
}