import { createContext, useContext, useState } from 'react';
import {
  ANIMATE_DIRECTION,
  ANIMATE_DIRECTION_LEFT,
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
  const [[currentComponent, direction, sendOrRequest], setCurrentComponentState] = useState<
    [QRScreenType | SendScreenType | ReceiveScreenType, ANIMATE_DIRECTION, 'Send' | 'Request' | undefined]
  >(['home', ANIMATE_DIRECTION_LEFT, undefined]);

  const setCurrentComponent = (
    [
      newComponent,
      newDirection,
      newSendOrRequest
    ]: [
        newScreen: QRScreenType | SendScreenType | ReceiveScreenType,
        newDirection: ANIMATE_DIRECTION,
        newSendOrRequest?: 'Send' | 'Request'
      ]) => {
    setCurrentComponentState([newComponent, newDirection, newSendOrRequest]);
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