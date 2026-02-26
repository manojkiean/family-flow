import { FamilyMember } from '@/types/family';
import { useActiveMember } from '@/contexts/ActiveMemberContext';
import { useFamilyMembers } from '@/hooks/useDatabase';
import { User, Crown, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export function ProfileSelection() {
    const { familyMembers, loading } = useFamilyMembers();
    const { setActiveMember } = useActiveMember();

    const handleSelect = (member: FamilyMember) => {
        setActiveMember(member);
    };

    if (loading) return null;

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
            >
                <h1 className="font-display font-bold text-4xl mb-3 tracking-tight">Who's using the Hub?</h1>
                <p className="text-muted-foreground text-lg">Select your profile to continue</p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-5xl">
                {familyMembers.map((member, index) => (
                    <motion.button
                        key={member.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => handleSelect(member)}
                        className="group flex flex-col items-center space-y-4 outline-none"
                    >
                        <div className="relative">
                            <div
                                className={cn(
                                    "w-28 h-28 md:w-32 md:h-32 rounded-3xl flex items-center justify-center overflow-hidden transition-all duration-300 ring-0 ring-primary/20",
                                    "group-hover:ring-8 group-hover:scale-105 group-active:scale-95 shadow-lg"
                                )}
                                style={{ backgroundColor: `${member.color}20` }}
                            >
                                {member.image_url ? (
                                    <img src={member.image_url} alt={member.name} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-12 h-12 text-muted-foreground" />
                                )}

                                {/* Role Badge */}
                                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-background shadow-md border border-border flex items-center justify-center">
                                    {member.role === 'parent' ? (
                                        <Crown className="h-4 w-4 text-primary" />
                                    ) : (
                                        <Star className="h-4 w-4 text-category-home" />
                                    )}
                                </div>
                            </div>
                        </div>
                        <p className="font-display font-semibold text-xl group-hover:text-primary transition-colors">
                            {member.name}
                        </p>
                    </motion.button>
                ))}
            </div>
        </div>
    );
}
