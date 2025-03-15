
import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import { Video, BarChart, Home, Cog } from "lucide-react";

const Navbar = () => {
  const location = useLocation();
  
  return (
    <div className="w-full border-b py-3">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold">Social Media Manager</h1>
        </div>
        
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link to="/">
                <NavigationMenuLink
                  className={cn(
                    "flex items-center px-4 py-2 text-sm font-medium transition-colors",
                    location.pathname === "/" 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <NavigationMenuTrigger className="flex items-center text-sm font-medium">
                <Video className="mr-2 h-4 w-4" />
                Content
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[220px] gap-3 p-4">
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/"
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="text-sm font-medium leading-none">Video Generator</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          Create and schedule videos
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink asChild>
                      <Link
                        to="/"
                        className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                      >
                        <div className="text-sm font-medium leading-none">Trending Topics</div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          View trending content ideas
                        </p>
                      </Link>
                    </NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Link to="/">
                <NavigationMenuLink
                  className={cn(
                    "flex items-center px-4 py-2 text-sm font-medium transition-colors",
                    location.pathname === "/analytics" 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <BarChart className="mr-2 h-4 w-4" />
                  Analytics
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
            
            <NavigationMenuItem>
              <Link to="/">
                <NavigationMenuLink
                  className={cn(
                    "flex items-center px-4 py-2 text-sm font-medium transition-colors",
                    location.pathname === "/settings" 
                      ? "text-primary" 
                      : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <Cog className="mr-2 h-4 w-4" />
                  Settings
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </div>
  );
};

export default Navbar;
