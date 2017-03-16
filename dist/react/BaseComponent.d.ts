/// <reference types="react" />
import * as React from 'react';
export declare class Component<P, S> extends React.Component<P, S> {
    private iocContext;
    protected GetComponent<T>(type: any): T;
    constructor(props: P, context: any);
}
