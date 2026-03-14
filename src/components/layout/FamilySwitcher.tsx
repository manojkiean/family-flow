import { useState } from 'react';
import { useFamilies, useFamilyId } from '@/hooks/useDatabase';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ChevronDown, Home, Plus, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FamilySwitcherProps {
    collapsed?: boolean;
}

export function FamilySwitcher({ collapsed }: FamilySwitcherProps) {
    const { families, loading, switchFamily } = useFamilies();
    const { familyId } = useFamilyId();
    const [switching, setSwitching] = useState<string | null>(null);

    const currentFamily = families.find(f => f.id === familyId);

    const handleSwitch = async (id: string) => {
        if (id === familyId) return;
        setSwitching(id);
        try {
            await switchFamily(id);
        } catch (err) {
            setSwitching(null);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className={cn(
                    "flex items-center gap-2 px-1.5 py-1 rounded-lg hover:bg-muted transition-all outline-none text-left group",
                    collapsed && "lg:justify-center lg:px-0"
                )}>
                    <div className="w-10 h-10 rounded-xl overflow-hidden shadow-soft shrink-0">
                        <img src="/favicon.png" alt="Family Board" className="w-full h-full object-cover" />
                    </div>
                    <div className={cn(
                        "flex-1 min-w-0 transition-opacity",
                        collapsed && "lg:hidden"
                    )}>
                        <div className="flex items-center gap-1">
                            <h1 className="font-display font-bold text-sm text-foreground truncate max-w-[120px]">
                                {loading ? "Loading..." : (currentFamily?.name || "Family Board")}
                            </h1>
                            <ChevronDown className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                        <p className="text-[10px] text-muted-foreground leading-none">Family Hub</p>
                    </div>
                </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" className="w-64 bg-popover border border-border shadow-xl z-[60]">
                <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-3 py-2">
                    Switch Family Hub
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <div className="max-h-[300px] overflow-y-auto py-1">
                    {families.map((family) => (
                        <DropdownMenuItem
                            key={family.id}
                            onClick={() => handleSwitch(family.id)}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-colors",
                                family.id === familyId && "bg-primary/5 text-primary"
                            )}
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center bg-muted/50 text-muted-foreground shrink-0",
                                family.id === familyId && "bg-primary/10 text-primary"
                            )}>
                                <Home className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{family.name}</p>
                                {family.id === familyId && <p className="text-[10px] opacity-70">Current Active</p>}
                            </div>
                            {switching === family.id ? (
                                <Loader2 className="h-4 w-4 animate-spin opacity-50" />
                            ) : family.id === familyId ? (
                                <Check className="h-4 w-4" />
                            ) : null}
                        </DropdownMenuItem>
                    ))}
                </div>

                <DropdownMenuSeparator />
                <DropdownMenuItem className="p-2">
                    <Button variant="ghost" size="sm" className="w-full justify-start text-xs h-8 text-primary hover:text-primary hover:bg-primary/5">
                        <Plus className="h-3 w-3 mr-2" />
                        Create New Family
                    </Button>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
