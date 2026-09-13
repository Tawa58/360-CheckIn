import React, {createContext, useContext, useMemo, useState} from 'react';

type DrawerContextValue = {
  open: boolean;
  show: () => void;
  hide: () => void;
};

const DrawerContext = createContext<DrawerContextValue | null>(null);

export function DrawerProvider({children}: {children: React.ReactNode}) {
  const [open, setOpen] = useState(false);
  const value = useMemo(
    () => ({
      open,
      show: () => setOpen(true),
      hide: () => setOpen(false),
    }),
    [open],
  );
  return <DrawerContext.Provider value={value}>{children}</DrawerContext.Provider>;
}

export function useDrawer() {
  const value = useContext(DrawerContext);
  if (!value) {
    throw new Error('useDrawer must be used inside DrawerProvider');
  }
  return value;
}
