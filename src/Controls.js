import React from 'react';

export function Tooltip(props) {
    return (
        <div className={"tooltip " + (props.className ? props.className : "")}>
            <span className="tooltiptext tooltip-top">{props.text}</span>
            {props.children}
        </div>
    );
}