/// <reference types="react" />
import { Component as ReactComponent } from 'react';
export declare class Component<P, S> extends ReactComponent<P, S> {
    static contextTypes: {
        iocContext: React.Requireable<any>;
    };
    private iocContext;
    protected GetComponent<T>(type: any): T;
    constructor(props: P, context: any);
}
