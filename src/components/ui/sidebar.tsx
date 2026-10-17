import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { PanelLeft } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

// Versión compacta del sidebar de shadcn: fijo en escritorio (colapsable) y en hoja lateral en móvil.

const MOBILE_QUERY = "(max-width: 767px)";

function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(() => window.matchMedia(MOBILE_QUERY).matches);
  React.useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return isMobile;
}

type SidebarContextValue = {
  open: boolean;
  openMobile: boolean;
  isMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within a <SidebarProvider />");
  return ctx;
}

export function SidebarProvider({ className, children, ...props }: React.ComponentProps<"div">) {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(true);
  const [openMobile, setOpenMobile] = React.useState(false);

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) setOpenMobile((o) => !o);
    else setOpen((o) => !o);
  }, [isMobile]);

  return (
    <SidebarContext.Provider value={{ open, openMobile, isMobile, setOpenMobile, toggleSidebar }}>
      <div className={cn("flex min-h-svh w-full", className)} {...props}>
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

export function Sidebar({ className, children }: React.ComponentProps<"div">) {
  const { open, openMobile, isMobile, setOpenMobile } = useSidebar();

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent side="left" className="flex w-72 flex-col gap-0 bg-card p-0">
          <SheetTitle className="sr-only">Navegación</SheetTitle>
          <SheetDescription className="sr-only">Secciones del monitor</SheetDescription>
          {children}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      data-state={open ? "expanded" : "collapsed"}
      className={cn(
        "sticky top-0 hidden h-svh shrink-0 flex-col overflow-hidden border-r bg-card transition-[width] duration-200 md:flex",
        open ? "w-64" : "w-0 border-r-0",
        className,
      )}
    >
      <div className="flex h-full w-64 flex-col">{children}</div>
    </aside>
  );
}

export function SidebarInset({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("relative flex flex-1 flex-col bg-background", className)} {...props} />;
}

export function SidebarTrigger({ className, onClick, ...props }: React.ComponentProps<typeof Button>) {
  const { toggleSidebar } = useSidebar();
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("size-8", className)}
      onClick={(e) => {
        onClick?.(e);
        toggleSidebar();
      }}
      {...props}
    >
      <PanelLeft />
    </Button>
  );
}

export function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-2 p-3", className)} {...props} />;
}

export function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex min-h-0 flex-1 flex-col gap-2 overflow-auto", className)} {...props} />;
}

export function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-2 border-t p-3", className)} {...props} />;
}

export function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex w-full min-w-0 flex-col p-2", className)} {...props} />;
}

export function SidebarGroupLabel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex h-8 shrink-0 items-center px-2 text-xs font-medium text-muted-foreground", className)}
      {...props}
    />
  );
}

export function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return <ul className={cn("flex w-full min-w-0 flex-col gap-1", className)} {...props} />;
}

export function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return <li className={cn("relative", className)} {...props} />;
}

export function SidebarMenuButton({
  asChild = false,
  isActive = false,
  className,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean; isActive?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-active={isActive}
      className={cn(
        "flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring data-[active=true]:bg-accent data-[active=true]:font-medium data-[active=true]:text-foreground [&>svg]:size-4 [&>svg]:shrink-0",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarMenuBadge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute right-2 top-1/2 flex h-5 min-w-5 -translate-y-1/2 items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums",
        className,
      )}
      {...props}
    />
  );
}
