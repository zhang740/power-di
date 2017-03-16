/// <reference types="react" />
import { Component } from 'react';
import { IocContext } from '../IocContext';
export interface PropsDefine {
    context?: IocContext;
}
export declare class IocProvider extends Component<PropsDefine, {}> {
    static childrenContextTypes: any;
    private iocContext;
    constructor(props: PropsDefine, context: any);
    getChildContext(): {
        iocContext: IocContext;
    };
    render(): React.ReactElement<any>;
}
