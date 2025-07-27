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
      <SidebarContent>
        {/* Folders Section */}
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Projects
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {folders.map((folder) => (
                <SidebarMenuItem key={folder.id}>
                  <SidebarMenuButton
                    className={cn(
                      "h-10 px-3 font-normal",
                      activeFolder === folder.id 
                        ? "bg-studio-accent text-studio-bg font-medium" 
                        : "text-studio-muted hover:text-studio-text hover:bg-accent"
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

        {/* Navigation Section */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to="/" 
                    className={({ isActive }) => cn(
                      "h-10 px-3",
                      isActive && !isProfilePage ? "bg-studio-accent text-studio-bg font-medium" : "text-studio-muted hover:text-studio-text hover:bg-accent"
                    )}
                  >
                    <Home className="h-5 w-5" />
                    {!collapsed && <span className="ml-3">Studio</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="h-10 px-3 text-studio-muted hover:text-studio-text hover:bg-accent"
                >
                  <Plus className="h-5 w-5" />
                  {!collapsed && <span className="ml-3">New Project</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to="/profile" 
                    className={({ isActive }) => cn(
                      "h-10 px-3",
                      isActive ? "bg-studio-accent text-studio-bg font-medium" : "text-studio-muted hover:text-studio-text hover:bg-accent"
                    )}
                  >
                    <User className="h-5 w-5" />
                    {!collapsed && <span className="ml-3">Profile</span>}
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