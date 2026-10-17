import { ArrowLeft, Droplets, LogOut } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { monitorSections } from "@/components/monitor/monitor-data";
import { LEVELS, type Level } from "@/hooks/use-reservoir-sim";

export function MonitorSidebar({
  active,
  lvl,
  alertCount,
  user,
  onSignOut,
}: {
  active: string;
  lvl: Level;
  alertCount: number;
  user: { name: string; role: string; initials: string };
  onSignOut: () => void;
}) {
  const { isMobile, setOpenMobile } = useSidebar();

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-1 py-1">
          <span className="flex size-9 items-center justify-center rounded-lg bg-agua/15 text-agua">
            <Droplets className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="font-display text-base font-bold leading-tight">Vigía Pluvial</p>
            <p className="truncate text-xs text-muted-foreground">Bordo de retención · piloto</p>
          </div>
        </div>
        <div
          className="flex items-center gap-2 rounded-md border px-2.5 py-2 text-xs"
          style={{ borderColor: LEVELS[lvl].color }}
        >
          <span className="size-2.5 rounded-full" style={{ background: LEVELS[lvl].color }} />
          <span className="font-medium">Nivel {LEVELS[lvl].name.toLowerCase()}</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Monitor</SidebarGroupLabel>
          <SidebarMenu>
            {monitorSections.map((s) => (
              <SidebarMenuItem key={s.id}>
                <SidebarMenuButton isActive={active === s.id} onClick={() => go(s.id)}>
                  <s.icon />
                  <span>{s.label}</span>
                </SidebarMenuButton>
                {s.id === "bitacora" && alertCount > 0 && (
                  <SidebarMenuBadge className="bg-primary/15 text-primary">{alertCount}</SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="#/">
                  <ArrowLeft />
                  <span>Volver a la portada</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center gap-2">
          <Avatar className="size-8">
            <AvatarFallback className="bg-agua/15 text-xs font-semibold text-agua">{user.initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{user.role}</p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="cursor-pointer rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
