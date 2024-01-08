import { createContext, useContext, useState } from 'react';
import {
  ISubScreenContext,
  ISubScreenContextProviderProps,
  QRScreenType,
  ReceiveScreenType,
  SendScreenType
} from '../types';

const SubScreenContext = createContext<ISubScreenContext | undefined>(undefined);

export const useSubScreenContext = () => {
  const context = useContext(SubScreenContext);
  if (!context) {
    throw new Error('useSubScreenContext must be used within a SubScreenContextProvider');
  }
  return context;
};

export const SubScreenProvider = ({ children }: ISubScreenContextProviderProps) => {
  const [[currentComponent, direction, sendOrRequest], setCurrentScreenState] = useState<
    [QRScreenType | SendScreenType | ReceiveScreenType, number, 'Send' | 'Request' | undefined]
  >(['home', -1, undefined]);

  const setCurrentComponent = (
    [
      newComponent,
      newDirection,
      newSendOrRequest
    ]: [
        newScreen: QRScreenType | SendScreenType | ReceiveScreenType,
        newDirection: number,
        newSendOrRequest?: 'Send' | 'Request'
      ]) => {
    setCurrentScreenState([newComponent, newDirection, newSendOrRequest]);
  };

  const value: ISubScreenContext = {
    currentComponent,
    direction,
    sendOrRequest,
    setCurrentComponent,
  }

  return (
    <SubScreenContext.Provider value={value}>
      {children}
    </SubScreenContext.Provider>
  );
}