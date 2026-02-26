import { IocContext } from '@power-di/di';
import * as React from 'react';

export const Context = React.createContext(IocContext.DefaultInstance);

export const ContextSymbol = '__PowerDIContext';
