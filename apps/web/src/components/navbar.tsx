import { Button } from "@pirxey-recruitment-task/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@pirxey-recruitment-task/ui/components/dropdown-menu";
import { Skeleton } from "@pirxey-recruitment-task/ui/components/skeleton";
import { Link, useNavigate } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";

import { ThemeToggle } from "./theme-toggle";

export const Navbar = () => {
  const navigate = useNavigate();
  const { data: session, isPending } = authClient.useSession();

  const accountMenu = (() => {
    if (isPending) {
      return <Skeleton className="h-9 w-24" />;
    }

    if (session) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button className="ml-1" variant="outline" />}
          >
            {session.user.name}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-card">
            <DropdownMenuGroup>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>{session.user.email}</DropdownMenuItem>
              <DropdownMenuItem>
                <Link
                  className="flex w-full items-center"
                  params={{ name: session.user.name }}
                  to="/shelf/$name"
                >
                  My Shelf
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  authClient.signOut({
                    fetchOptions: {
                      onSuccess: () => {
                        navigate({ to: "/" });
                      },
                    },
                  });
                }}
              >
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }

    return (
      <Link to="/login">
        <Button variant="outline">Sign In</Button>
      </Link>
    );
  })();

  return (
    <header className="border-b border-hairline bg-paper">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5 sm:px-8">
        <Link
          className="text-[1.125rem] font-medium tracking-tight text-ink transition-colors hover:text-magenta"
          to="/"
        >
          Shelf
        </Link>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          {accountMenu}
        </div>
      </div>
    </header>
  );
};
