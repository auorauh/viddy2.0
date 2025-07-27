import { useState } from "react";
import { Folder, Plus, Home, User } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const folders = [
  { id: '1', name: 'All Scripts' },
  { id: '2', name: 'TikTok' },
  { id: '3', name: 'Instagram' },
  { id: '4', name: 'YouTube Videos' },
  { id: '5', name: 'Greater Creator' },
  { id: '6', name: 'Movements Series' },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const [activeFolder, setActiveFolder] = useState('4');
  
  const isProfilePage = location.pathname === '/profile';

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"}>
      <SidebarContent className="bg-sidebar border-r border-sidebar-border">
        {/* Folders Section */}
        <SidebarGroup className="flex-1">
          <SidebarGroupLabel className={collapsed ? "sr-only" : "text-sidebar-foreground"}>
            Projects
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {folders.map((folder) => (
                <SidebarMenuItem key={folder.id}>
                  <SidebarMenuButton
                    className={cn(
                      "h-10 px-3 font-normal text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      activeFolder === folder.id 
                        ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" 
                        : ""
                    )}
                    onClick={() => setActiveFolder(folder.id)}
                  >
                    <Folder className="h-4 w-4" />
                    {!collapsed && <span className="ml-3">{folder.name}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Bottom Navigation Section */}
        <SidebarGroup className="mt-auto border-t border-sidebar-border pt-4">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to="/" 
                    className={({ isActive }) => cn(
                      "h-10 px-3 text-white hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isActive && !isProfilePage ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" : ""
                    )}
                  >
                    <Home className="h-5 w-5 text-white" />
                    {!collapsed && <span className="ml-3 text-white">Studio</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to="/" 
                    className="h-10 px-3 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  >
                    <Plus className="h-5 w-5" />
                    {!collapsed && <span className="ml-3">New Project</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to="/profile" 
                    className={({ isActive }) => cn(
                      "h-10 px-3 text-white hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      isActive ? "bg-sidebar-primary text-sidebar-primary-foreground font-medium" : ""
                    )}
                  >
                    <User className="h-5 w-5 text-white" />
                    {!collapsed && <span className="ml-3 text-white">Profile</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}