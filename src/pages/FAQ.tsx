import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { ChevronLeft, HelpCircle, MessageSquare, Shield, Clock, Users } from 'lucide-react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
    {
        category: "General",
        icon: HelpCircle,
        items: [
            {
                question: "What is FamilyHub?",
                answer: "FamilyHub is a comprehensive activity and schedule tracker designed specifically for families. It helps parents manage school schedules, sports events, and health appointments while allowing children to stay on top of their own tasks."
            },
            {
                question: "How do I add a new family member?",
                answer: "Go to the 'Family' page from the sidebar. If you have parent permissions, you'll see an 'Add Member' button where you can customize their name, role, and avatar."
            }
        ]
    },
    {
        category: "Activities & Scheduling",
        icon: Clock,
        items: [
            {
                question: "How do I create a recurring activity?",
                answer: "When adding an activity, use the 'Recurrence' dropdown to select between Daily, Weekly, or Monthly. The system will automatically generate slots for these events in your calendar."
            },
            {
                question: "Can I assign multiple people to one activity?",
                answer: "Yes! In the activity creation form, you can select multiple parents and children. They will all see the activity on their respective schedules."
            }
        ]
    },
    {
        category: "Permissions & Roles",
        icon: Shield,
        items: [
            {
                question: "What's the difference between Parent and Child roles?",
                answer: "Parents have full control over the family schedule, including the ability to add/edit/delete any activity and manage family members. Children can view all activities but can only mark their assigned tasks as completed."
            },
            {
                question: "Can I change a member's role after they've been added?",
                answer: "Yes, parents can edit any member's profile from the Family page to change their role, name, or avatar."
            }
        ]
    }
];

const FAQ = () => {
    const navigate = useNavigate();

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-12">
                {/* Header */}
                <div className="flex flex-col gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-fit -ml-2 text-muted-foreground hover:text-primary transition-colors"
                        onClick={() => navigate(-1)}
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back
                    </Button>

                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl gradient-warm flex items-center justify-center shadow-soft shrink-0">
                            <HelpCircle className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="font-display font-bold text-3xl text-foreground tracking-tight">FAQ</h1>
                            <p className="text-muted-foreground">Everything you need to know about FamilyHub</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="grid gap-8">
                    {faqs.map((group, groupIdx) => (
                        <div key={groupIdx} className="space-y-4">
                            <div className="flex items-center gap-2 px-1">
                                <group.icon className="h-4 w-4 text-primary" />
                                <h2 className="font-display font-semibold text-xl tracking-tight text-foreground/90 uppercase text-xs">
                                    {group.category}
                                </h2>
                            </div>

                            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl overflow-hidden shadow-sm">
                                <Accordion type="single" collapsible className="w-full">
                                    {group.items.map((item, idx) => (
                                        <AccordionItem key={idx} value={`item-${groupIdx}-${idx}`} className="border-b border-border/50 last:border-0">
                                            <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/30 transition-all text-left font-medium text-foreground/80">
                                                {item.question}
                                            </AccordionTrigger>
                                            <AccordionContent className="px-6 pb-4 text-muted-foreground leading-relaxed">
                                                {item.answer}
                                            </AccordionContent>
                                        </AccordionItem>
                                    ))}
                                </Accordion>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Support CTA */}
                <div className="rounded-3xl bg-gradient-to-br from-primary/5 via-orange-500/5 to-secondary/20 border border-primary/10 p-8 text-center space-y-4 shadow-xl shadow-primary/5">
                    <div className="inline-flex w-12 h-12 rounded-full bg-white items-center justify-center shadow-md mb-2">
                        <MessageSquare className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-display font-bold text-xl">Still have questions?</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                        We're here to help you get the most out of your family coordination. Reach out to our support team anytime.
                    </p>
                    <div className="pt-4 flex items-center justify-center gap-4">
                        <Button className="gradient-warm shadow-soft">Contact Support</Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
};

export default FAQ;
