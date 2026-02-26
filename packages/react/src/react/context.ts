import * as React from 'react';
import { IocContext } from '@power-di/di';

export const Context = React.createContext(IocContext.DefaultInstance);

export const ContextSymbol = '__PowerDIContext';
