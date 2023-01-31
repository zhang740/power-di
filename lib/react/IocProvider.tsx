import * as React from 'react';
import { Context } from './context';
import { IocContext } from '../IocContext';

export const IocProvider: React.FC<{
  context?: IocContext;
  children?: React.ReactNode | undefined;
}> = props => {
  return (
    <Context.Provider value={props.context || IocContext.DefaultInstance}>
      {props.children}
    </Context.Provider>
  );
};
