'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Menu } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import WorkspaceSwitcher from './workspace-switcher';
import type { ViewType } from './workspace-switcher';

interface MobileNavProps {
  activeViewType: ViewType;
  renderChannelList: (isMobile?: boolean) => React.ReactNode;
  pathname: string;
}

export default function MobileNav({ activeViewType, renderChannelList, pathname }: MobileNavProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  useEffect(() => {
    if (pathname !== prevPathname) {
      setMobileNavOpen(false);
      setPrevPathname(pathname);
    }
  }, [pathname, prevPathname]);

  return (
    <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[80vw] flex p-0 gap-0 bg-background"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
        </SheetHeader>
        <WorkspaceSwitcher activeViewType={activeViewType} />
        {renderChannelList(true)}
      </SheetContent>
    </Sheet>
  );
}
